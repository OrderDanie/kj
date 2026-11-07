import fs from "node:fs/promises";
import { spawn } from "node:child_process";
import path from "node:path";

const SAMPLE_RATE = 48000;
const FFT_SIZE = 256;
const ANALYSIS_FPS = 60;
const clamp = (x, a, b) => Math.min(b, Math.max(a, x));

// Restrict demuxers as well as network protocols. A playlist or URL is never
// passed to FFmpeg, and uploaded filenames are never used as filesystem paths.
async function detectAudioFormat(file) {
  const handle = await fs.open(file, "r");
  let header;
  try {
    header = Buffer.alloc(16);
    const { bytesRead } = await handle.read(header, 0, 16, 0);
    header = header.subarray(0, bytesRead);
  } finally { await handle.close(); }
  if (header.subarray(0, 3).toString("ascii") === "ID3" || (header[0] === 0xff && (header[1] & 0xe0) === 0xe0)) return "mp3";
  if (["RIFF", "RF64"].includes(header.subarray(0, 4).toString("ascii")) && header.subarray(8, 12).toString("ascii") === "WAVE") return "wav";
  if (header.subarray(0, 4).toString("ascii") === "fLaC") return "flac";
  if (header.subarray(0, 4).toString("ascii") === "OggS") return "ogg";
  if (header.subarray(4, 8).toString("ascii") === "ftyp") return "mov";
  if (header.subarray(0, 4).equals(Buffer.from([0x1a, 0x45, 0xdf, 0xa3]))) return "matroska";
  if (header.subarray(0, 4).toString("ascii") === "FORM" && ["AIFF", "AIFC"].includes(header.subarray(8, 12).toString("ascii"))) return "aiff";
  throw new Error("Unsupported audio file. Use MP3, WAV, M4A, FLAC, Ogg, WebM, or AIFF.");
}

function run(executable, args, { signal, collectStdout = false, maxOutput = 1024 * 1024, timeoutMs = 0 } = {}) {
  return new Promise((resolve, reject) => {
    const child = spawn(executable, args, { stdio: ["ignore", collectStdout ? "pipe" : "ignore", "pipe"], signal });
    let stderr = "";
    let outputSize = 0;
    const output = [];
    let timedOut = false;
    const timeout = timeoutMs ? setTimeout(() => { timedOut = true; child.kill("SIGKILL"); }, timeoutMs) : null;
    child.stderr.on("data", (chunk) => { stderr = (stderr + chunk.toString()).slice(-12000); });
    child.stdout?.on("data", (chunk) => {
      outputSize += chunk.length;
      if (outputSize > maxOutput) child.kill("SIGKILL");
      else output.push(chunk);
    });
    child.on("error", (err) => { if (timeout) clearTimeout(timeout); reject(err); });
    child.on("close", (code) => {
      if (timeout) clearTimeout(timeout);
      if (code !== 0 || outputSize > maxOutput) {
        const err = new Error(timedOut ? "Audio processing timed out." : "Audio processing failed. Check that the soundtrack is a valid audio file.");
        err.detail = stderr;
        reject(err);
      } else resolve(collectStdout ? Buffer.concat(output) : undefined);
    });
  });
}

/** Mix all uploaded audio, with its original start time and gain, to one PCM track. */
export async function prepareAudio(job, config, signal) {
  const { manifest, files, dir } = job;
  const inputs = [];
  for (const track of manifest.audioTracks) {
    const file = files[track.fileIndex].path;
    const format = await detectAudioFormat(file);
    const probe = await run(config.ffprobe, ["-v", "error", "-protocol_whitelist", "file,pipe", "-f", format,
      "-show_entries", "stream=codec_type", "-of", "json", file], { signal, collectStdout: true, timeoutMs: 30000 });
    let parsed;
    try { parsed = JSON.parse(probe.toString()); } catch { throw new Error("Unable to inspect the uploaded audio."); }
    if (!parsed.streams?.some((s) => s.codec_type === "audio")) throw new Error("The uploaded file does not contain an audio stream.");
    inputs.push({ file, format, ...track });
  }
  const output = path.join(dir, "mixed-audio.wav");
  const args = ["-hide_banner", "-loglevel", "error", "-y"];
  for (const input of inputs) args.push("-protocol_whitelist", "file,pipe", "-f", input.format, "-i", input.file);
  const filters = inputs.map((input, i) => {
    const delay = Math.round(input.start * 1000);
    return `[${i}:a:0]aresample=${SAMPLE_RATE},aformat=sample_fmts=fltp:channel_layouts=stereo,volume=${input.volume},adelay=${delay}|${delay}[a${i}]`;
  });
  const sources = inputs.map((_, i) => `[a${i}]`).join("");
  const mixed = inputs.length === 1 ? sources : `${sources}amix=inputs=${inputs.length}:duration=longest:normalize=0`;
  filters.push(`${mixed}${inputs.length === 1 ? "" : ","}apad,atrim=duration=${manifest.project.duration},asetpts=PTS-STARTPTS[mix]`);
  args.push("-filter_complex", filters.join(";"), "-map", "[mix]", "-c:a", "pcm_f32le", "-ar", String(SAMPLE_RATE), "-ac", "2", output);
  await run(config.ffmpeg, args, { signal });

  // Mono PCM is used only to reproduce the player's AnalyserNode low-band energy;
  // the stereo mix above is what goes into the final MP4.
  const maxPcmBytes = Math.ceil((manifest.project.duration + 1) * SAMPLE_RATE * 4);
  const pcm = await run(config.ffmpeg, ["-hide_banner", "-loglevel", "error", "-i", output, "-f", "f32le", "-acodec", "pcm_f32le", "-ac", "1", "-ar", String(SAMPLE_RATE), "pipe:1"],
    { signal, collectStdout: true, maxOutput: maxPcmBytes });
  const copy = Uint8Array.from(pcm); // aligned backing buffer for Float32Array
  const samples = new Float32Array(copy.buffer, 0, Math.floor(copy.byteLength / 4));
  return { output, energies: analyseLowBand(samples, manifest.project.duration) };
}

// Web Audio's 256-point Blackman-windowed FFT, default -100..-30 dB range,
// analyser smoothing 0.55 and the player's additional 0.6/0.4 smoothing.
// Sample at the player's normal 60 Hz, even when exporting at 30 FPS.
export function analyseLowBand(samples, duration) {
  const n = FFT_SIZE;
  const window = new Float64Array(n);
  const cos = Array.from({ length: 8 }, () => new Float64Array(n));
  const sin = Array.from({ length: 8 }, () => new Float64Array(n));
  for (let j = 0; j < n; j++) {
    window[j] = 0.42 - 0.5 * Math.cos(2 * Math.PI * j / n) + 0.08 * Math.cos(4 * Math.PI * j / n);
    for (let k = 1; k <= 8; k++) {
      cos[k - 1][j] = Math.cos(2 * Math.PI * k * j / n);
      sin[k - 1][j] = Math.sin(2 * Math.PI * k * j / n);
    }
  }
  const count = Math.ceil(duration * ANALYSIS_FPS);
  const result = new Float32Array(count);
  const smoothMagnitudes = new Float64Array(8);
  let visualEnergy = 0;
  for (let frame = 0; frame < count; frame++) {
    const end = Math.floor(frame * SAMPLE_RATE / ANALYSIS_FPS);
    const start = end - n;
    let sum = 0;
    for (let k = 0; k < 8; k++) {
      let real = 0, imaginary = 0;
      for (let j = 0; j < n; j++) {
        const index = start + j;
        const sample = index >= 0 && index < samples.length ? samples[index] * window[j] : 0;
        real += sample * cos[k][j];
        imaginary -= sample * sin[k][j];
      }
      const magnitude = Math.hypot(real, imaginary) / n;
      smoothMagnitudes[k] = 0.55 * smoothMagnitudes[k] + 0.45 * magnitude;
      const db = 20 * Math.log10(Math.max(smoothMagnitudes[k], 1e-20));
      sum += Math.floor(clamp((db + 100) / 70, 0, 1) * 255);
    }
    const energy = clamp((sum / 8 / 255 - 0.42) / 0.4, 0, 1);
    visualEnergy = visualEnergy * 0.6 + energy * 0.4;
    result[frame] = visualEnergy;
  }
  return result;
}
