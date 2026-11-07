import { spawn } from "node:child_process";
import fs from "node:fs/promises";
import path from "node:path";
import { chromium } from "playwright";
import { prepareAudio } from "./audio.mjs";

function startEncoder(job, config, mixedAudio, signal, onEncodedFrame) {
  const { fps, quality } = job.manifest.settings;
  const output = path.join(job.dir, "playback.mp4");
  const args = [
    "-hide_banner", "-loglevel", "error", "-y",
    "-f", "image2pipe", "-framerate", String(fps), "-vcodec", "png", "-i", "pipe:0",
    "-i", mixedAudio, "-map", "0:v:0", "-map", "1:a:0",
    "-c:v", "libx264", "-preset", quality === "high" ? "medium" : "veryfast",
    "-crf", quality === "high" ? "17" : "23", "-tune", "animation",
    "-vf", "scale=in_range=full:out_range=tv:out_color_matrix=bt709,format=yuv420p",
    "-pix_fmt", "yuv420p", "-color_range", "tv", "-colorspace", "bt709", "-color_primaries", "bt709", "-color_trc", "bt709",
    "-c:a", "aac", "-b:a", quality === "high" ? "256k" : "192k",
    "-frames:v", String(job.manifest.totalFrames), "-t", String(job.manifest.project.duration),
    "-movflags", "+faststart", "-progress", "pipe:3", output,
  ];
  const proc = spawn(config.ffmpeg, args, { stdio: ["pipe", "ignore", "pipe", "pipe"], signal });
  let stderr = "", progress = "";
  proc.stderr.on("data", (chunk) => { stderr = (stderr + chunk.toString()).slice(-12000); });
  proc.stdio[3].on("data", (chunk) => {
    progress += chunk.toString();
    const lines = progress.split("\n");
    progress = lines.pop() || "";
    for (const line of lines) {
      if (line.startsWith("frame=")) {
        const frame = Number(line.slice(6).trim());
        if (Number.isFinite(frame)) onEncodedFrame(frame);
      }
    }
  });
  const done = new Promise((resolve, reject) => {
    proc.on("error", reject);
    proc.on("close", (code) => {
      if (code === 0) resolve();
      else {
        const err = new Error("FFmpeg could not encode the video.");
        err.detail = stderr;
        reject(err);
      }
    });
  });
  // Avoid an unhandled rejection if FFmpeg exits while Chromium is capturing.
  done.catch(() => {});
  proc.stdin.on("error", () => {}); // write callbacks and `done` report the failure
  return { proc, done, output };
}

function writeFrame(stream, frame) {
  return new Promise((resolve, reject) => {
    if (stream.destroyed || !stream.writable) return reject(new Error("The video encoder stopped unexpectedly."));
    stream.write(frame, (err) => err ? reject(err) : resolve());
  });
}

/** Capture the real, shared React stage at exact times; there is no wall-clock playback. */
export async function renderJob(job, config, internalOrigin, update, signal) {
  let browser, encoder;
  const abort = () => {
    if (encoder?.proc && !encoder.proc.killed) encoder.proc.kill("SIGKILL");
    if (browser) void browser.close().catch(() => {});
  };
  signal.addEventListener("abort", abort, { once: true });
  try {
    update({ state: "preparing", message: "Preparing and analysing audio" });
    const { output: mixedAudio, energies } = await prepareAudio(job, config, signal);
    if (signal.aborted) throw new Error("Render cancelled.");
    update({ state: "preparing", message: "Starting the cloud browser" });
    browser = await chromium.launch({
      headless: true,
      executablePath: config.chromiumPath || undefined,
      chromiumSandbox: config.chromiumSandbox,
      args: ["--disable-dev-shm-usage"],
    });
    const { width, height } = job.manifest.resolution;
    const context = await browser.newContext({ viewport: { width, height }, deviceScaleFactor: 1, locale: "ja-JP", serviceWorkers: "block" });
    // The page is a trusted local build. It cannot visit arbitrary sites or URLs.
    await context.route("**/*", (route) => {
      const url = new URL(route.request().url());
      if (url.origin === internalOrigin) return route.continue();
      return route.abort();
    });
    const page = await context.newPage();
    let pageError;
    page.on("pageerror", (err) => { pageError = err; });
    await page.goto(`${internalOrigin}/__render?__render=1`, { waitUntil: "domcontentloaded", timeout: 60000 });
    await page.waitForFunction(() => Boolean(window.__EXPORT_RENDERER__), null, { timeout: 60000 });
    const browserVersion = await page.evaluate(() => window.__EXPORT_RENDERER__.version);
    if (browserVersion !== job.projectVersion) throw new Error("The server renderer and uploaded project versions do not match.");
    await page.evaluate((project) => window.__EXPORT_RENDERER__.load(project), job.manifest.project);
    await page.evaluate(() => document.fonts.ready);
    if (pageError) throw pageError;
    encoder = startEncoder(job, config, mixedAudio, signal, (encodedFrames) => update({ encodedFrames }));

    const { fps } = job.manifest.settings;
    const { totalFrames } = job.manifest;
    const startedAt = Date.now();
    update({ state: "rendering", message: "Capturing animation frames", completedFrames: 0, estimatedSecondsRemaining: null });
    for (let i = 0; i < totalFrames; i++) {
      if (signal.aborted) throw new Error("Render cancelled.");
      if (pageError) throw pageError;
      const time = i / fps;
      const energy = energies[Math.min(Math.floor(time * 60 + 0.000001), energies.length - 1)] || 0;
      await page.evaluate(({ time: t, energy: e }) => window.__EXPORT_RENDERER__.frame(t, e), { time, energy });
      const image = await page.screenshot({ type: "png", animations: "disabled", timeout: 60000 });
      await writeFrame(encoder.proc.stdin, image);
      const completedFrames = i + 1;
      const elapsedSeconds = (Date.now() - startedAt) / 1000;
      const eta = completedFrames >= 5 ? Math.max(0, Math.ceil(elapsedSeconds / completedFrames * (totalFrames - completedFrames))) : null;
      update({ completedFrames, estimatedSecondsRemaining: eta });
    }
    update({ state: "encoding", message: "Finalizing the MP4", estimatedSecondsRemaining: null });
    encoder.proc.stdin.end();
    await encoder.done;
    const stat = await fs.stat(encoder.output);
    if (!stat.size) throw new Error("The encoder produced an empty file.");
    return encoder.output;
  } finally {
    signal.removeEventListener("abort", abort);
    if (encoder?.proc && encoder.proc.exitCode === null && !encoder.proc.killed) encoder.proc.kill("SIGKILL");
    if (browser) await browser.close().catch(() => {});
  }
}
