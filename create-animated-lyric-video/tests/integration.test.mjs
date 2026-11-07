import test from "node:test";
import assert from "node:assert/strict";
import { spawn, spawnSync } from "node:child_process";
import fs from "node:fs/promises";
import { existsSync, constants } from "node:fs";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { chromium } from "playwright";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const ffmpeg = process.env.FFMPEG_PATH || "ffmpeg";
const ffprobe = process.env.FFPROBE_PATH || "ffprobe";
const browser = process.env.CHROMIUM_EXECUTABLE_PATH || chromium.executablePath();
const exists = (file) => { try { return existsSync(file); } catch { return false; } };
const canRun = (command) => spawnSync(command, ["-version"], { stdio: "ignore" }).status === 0;
const available = exists(path.join(root, "dist/render-version.json")) && exists(browser) && canRun(ffmpeg) && canRun(ffprobe);
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
const command = (exe, args, encoding = "utf8") => {
  const result = spawnSync(exe, args, { encoding, maxBuffer: 32 * 1024 * 1024 });
  assert.equal(result.status, 0, result.stderr?.toString());
  return result.stdout;
};

async function waitForStatus(base, id, accept, timeout = 120000) {
  const end = Date.now() + timeout;
  const seen = [];
  while (Date.now() < end) {
    const response = await fetch(`${base}/api/renders/${id}`);
    const status = await response.json();
    seen.push(status);
    if (accept(status)) return { status, seen };
    if (status.state === "failed") throw new Error(`Render failed: ${status.error}`);
    await sleep(80);
  }
  throw new Error(`Timed out waiting for render: ${JSON.stringify(seen.at(-1))}`);
}

test("Chromium captures real frames and FFmpeg encodes synchronized MP4s", { skip: !available && "Build the app and install Chromium, FFmpeg and FFprobe (or set their *_PATH variables).", timeout: 240000 }, async (t) => {
  const temp = await fs.mkdtemp(path.join(os.tmpdir(), "playback-integration-"));
  const child = spawn(process.execPath, ["server/index.mjs"], {
    cwd: root,
    env: { ...process.env, PORT: "0", HOST: "127.0.0.1", RENDER_TEST_MODE: "1", RENDER_STORAGE_DIR: path.join(temp, "jobs"), RENDER_TTL_SECONDS: "2", ALLOWED_ORIGINS: "https://frontend.example", TRUST_PROXY: "1", CHROMIUM_EXECUTABLE_PATH: browser, FFMPEG_PATH: ffmpeg, FFPROBE_PATH: ffprobe },
    stdio: ["ignore", "pipe", "pipe"],
  });
  let logs = "";
  child.stdout.on("data", (b) => { logs += b; });
  child.stderr.on("data", (b) => { logs += b; });
  t.after(async () => {
    child.kill("SIGTERM");
    if (child.exitCode === null) await Promise.race([new Promise((resolve) => child.once("exit", resolve)), sleep(4000)]);
    if (child.exitCode === null) child.kill("SIGKILL");
    await fs.rm(temp, { recursive: true, force: true });
  });
  const deadline = Date.now() + 15000;
  while (!/listening on 127\.0\.0\.1:(\d+)/.test(logs) && Date.now() < deadline && child.exitCode === null) await sleep(50);
  const match = logs.match(/listening on 127\.0\.0\.1:(\d+)/);
  assert.ok(match, `Service did not start: ${logs}`);
  const base = `http://127.0.0.1:${match[1]}`;
  const health = await (await fetch(`${base}/api/health`)).json();
  assert.equal(health.ready, true, logs);

  const music = path.join(temp, "music.wav"), voice = path.join(temp, "voice.wav");
  command(ffmpeg, ["-v", "error", "-y", "-f", "lavfi", "-i", "sine=frequency=220:sample_rate=48000:duration=1", "-c:a", "pcm_s16le", music]);
  command(ffmpeg, ["-v", "error", "-y", "-f", "lavfi", "-i", "sine=frequency=880:sample_rate=48000:duration=1", "-c:a", "pcm_s16le", voice]);
  const musicBytes = await fs.readFile(music), voiceBytes = await fs.readFile(voice);
  const project = (duration) => ({ width: 1920, height: 1080, duration, showEnglish: true,
    scenes: [{ id: "intro", start: 0, end: 0.3 }, { id: "cell", start: 0.3, end: 149.5 }],
    lyrics: [{ s: 0.3, e: 1.8, jp: "歌", en: "song" }],
  });
  async function submit({ duration, resolution = "test", fps = 30, quality = "standard", tracks = 1 }) {
    const manifest = { schemaVersion: 1, projectVersion: health.projectVersion, project: project(duration), settings: { resolution, fps, quality },
      audioTracks: [{ fileIndex: 0, kind: "music", start: 0, volume: 1 }, ...(tracks === 2 ? [{ fileIndex: 1, kind: "voice", start: 0.25, volume: 0.5 }] : [])] };
    const form = new FormData();
    form.append("manifest", JSON.stringify(manifest));
    form.append("tracks", new Blob([musicBytes], { type: "audio/wav" }), "music.wav");
    if (tracks === 2) form.append("tracks", new Blob([voiceBytes], { type: "audio/wav" }), "voice.wav");
    const response = await fetch(`${base}/api/renders`, { method: "POST", headers: { "X-Render-Request": "playback-export-v1" }, body: form });
    assert.equal(response.status, 202, await response.clone().text());
    return (await response.json()).id;
  }
  async function download(id, name) {
    const response = await fetch(`${base}/api/renders/${id}/download`);
    assert.equal(response.status, 200);
    assert.match(response.headers.get("content-type"), /video\/mp4/);
    const file = path.join(temp, name);
    await fs.writeFile(file, Buffer.from(await response.arrayBuffer()));
    const { status } = await waitForStatus(base, id, (s) => s.state === "downloaded");
    assert.equal(status.downloadUrl, null);
    for (let i = 0; i < 20 && exists(path.join(temp, "jobs", `job-${id}`)); i++) await sleep(25);
    assert.equal(exists(path.join(temp, "jobs", `job-${id}`)), false, "temporary files must be removed after download");
    return file;
  }
  function probe(file) {
    return JSON.parse(command(ffprobe, ["-v", "error", "-show_entries", "stream=codec_type,codec_name,pix_fmt,width,height,avg_frame_rate,nb_frames,duration:format=duration", "-of", "json", file]));
  }
  await t.test("30 FPS, real progress, transitions and a delayed voice track", async () => {
    const id = await submit({ duration: 0.6, tracks: 2 });
    const { status, seen } = await waitForStatus(base, id, (s) => s.state === "complete");
    assert.equal(status.totalFrames, 18);
    assert.equal(status.completedFrames, 18);
    assert.ok(seen.some((s) => s.state === "rendering" && s.completedFrames > 0 && s.completedFrames < s.totalFrames), "progress must follow captured frames");
    const file = await download(id, "30fps.mp4");
    const info = probe(file), video = info.streams.find((s) => s.codec_type === "video"), audio = info.streams.find((s) => s.codec_type === "audio");
    assert.deepEqual([video.codec_name, video.pix_fmt, video.width, video.height, video.avg_frame_rate, Number(video.nb_frames)], ["h264", "yuv420p", 320, 180, "30/1", 18]);
    assert.equal(audio.codec_name, "aac");
    assert.ok(Math.abs(Number(audio.duration) - 0.6) < 0.03);
    const hashes = command(ffmpeg, ["-v", "error", "-i", file, "-map", "0:v:0", "-f", "framemd5", "-"]).split("\n").filter((s) => s && !s.startsWith("#")).map((s) => s.split(",").at(-1).trim());
    assert.equal(hashes.length, 18);
    assert.ok(new Set(hashes).size > 1, "captured frames should show actual animation changes");
    const decoded = command(ffmpeg, ["-v", "error", "-i", file, "-map", "0:a:0", "-f", "f32le", "-ac", "1", "-ar", "48000", "-"], null);
    const amplitude = (from, to, frequency) => {
      let re = 0, im = 0;
      for (let i = Math.floor(from * 48000); i < Math.floor(to * 48000); i++) {
        const sample = decoded.readFloatLE(i * 4);
        re += sample * Math.cos(2 * Math.PI * frequency * i / 48000);
        im += sample * Math.sin(2 * Math.PI * frequency * i / 48000);
      }
      return Math.hypot(re, im) / ((to - from) * 48000);
    };
    assert.ok(amplitude(0.35, 0.5, 880) > amplitude(0.05, 0.2, 880) * 5, "voice must enter at its configured time");
    assert.ok(amplitude(0.05, 0.2, 220) > 0.01, "music must be audible from the start");
  });
  await t.test("60 FPS and high quality", async () => {
    const id = await submit({ duration: 0.5, fps: 60, quality: "high" });
    const { status } = await waitForStatus(base, id, (s) => s.state === "complete");
    assert.equal(status.totalFrames, 30);
    const video = probe(await download(id, "60fps.mp4")).streams.find((s) => s.codec_type === "video");
    assert.equal(video.avg_frame_rate, "60/1");
    assert.equal(Number(video.nb_frames), 30);
  });
  for (const [resolution, width, height] of [["original", 1920, 1080], ["1080p", 1920, 1080], ["1440p", 2560, 1440], ["4k", 3840, 2160]]) {
    await t.test(`${resolution} produces the requested dimensions`, async () => {
      const id = await submit({ duration: 1 / 30, resolution });
      await waitForStatus(base, id, (s) => s.state === "complete");
      const video = probe(await download(id, `${resolution}.mp4`)).streams.find((s) => s.codec_type === "video");
      assert.deepEqual([video.width, video.height], [width, height]);
    });
  }
  await t.test("the real timeline's scenes, transitions and lyrics render deterministically", async () => {
    const timeline = await fs.readFile(path.join(root, "src/timeline.tsx"), "utf8");
    const scenes = [...timeline.matchAll(/\{ id: "([a-z0-9_-]+)", start: ([\d.]+), end: ([\d.]+), r:/g)]
      .map((match) => ({ id: match[1], start: Number(match[2]), end: Number(match[3]) }));
    assert.ok(scenes.length >= 30);
    const ts = await import("typescript");
    const source = await fs.readFile(path.join(root, "src/lyrics.ts"), "utf8");
    const compiled = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.ESNext } }).outputText;
    const { LYRICS: lyrics } = await import(`data:text/javascript;base64,${Buffer.from(compiled).toString("base64")}`);
    const snapshot = { width: 1920, height: 1080, duration: 149.5, scenes, lyrics, showEnglish: true };
    const browserInstance = await chromium.launch({ executablePath: browser, headless: true, args: ["--disable-dev-shm-usage"] });
    try {
      const page = await browserInstance.newPage({ viewport: { width: 320, height: 180 } });
      const errors = [];
      page.on("pageerror", (error) => errors.push(error.message));
      await page.goto(`${base}/__render?__render=1`, { waitUntil: "domcontentloaded" });
      await page.waitForFunction(() => Boolean(window.__EXPORT_RENDERER__));
      await page.evaluate((value) => window.__EXPORT_RENDERER__.load(value), snapshot);
      const frame = async (time) => {
        await page.evaluate(({ time: value }) => window.__EXPORT_RENDERER__.frame(value, 0.6), { time });
        return page.screenshot({ type: "png", animations: "disabled" });
      };
      for (const scene of scenes) {
        if (scene.start > 0) await frame(scene.start + 0.06); // scene cross-fade
        const image = await frame(scene.start + Math.min((scene.end - scene.start) / 2, 3));
        assert.ok(image.length > 100, `${scene.id} should paint a frame`);
      }
      assert.deepEqual(errors, []);
      const first = await frame(39.4);
      await frame(56);
      const repeated = await frame(39.4);
      assert.deepEqual(first, repeated, "rendered pixels must depend on timeline time, not wall clock");
      await frame(4);
      assert.ok((await page.locator("body").innerText()).includes(lyrics[0].en), "English gloss should be rendered when enabled");
      await page.evaluate((value) => window.__EXPORT_RENDERER__.load(value), { ...snapshot, showEnglish: false });
      await frame(4);
      assert.equal((await page.locator("body").innerText()).includes(lyrics[0].en), false);
    } finally { await browserInstance.close(); }
  });
  await t.test("queued and running jobs can be cancelled and their files removed", async () => {
    const running = await submit({ duration: 2, resolution: "4k" });
    const queued = await submit({ duration: 0.5 });
    const queuedStatus = await (await fetch(`${base}/api/renders/${queued}`)).json();
    assert.equal(queuedStatus.state, "queued");
    assert.equal(queuedStatus.queuePosition, 1);
    const cancel = (id) => fetch(`${base}/api/renders/${id}`, { method: "DELETE", headers: { "X-Render-Request": "playback-export-v1" } });
    assert.equal((await cancel(queued)).status, 200);
    assert.equal((await cancel(running)).status, 200);
    await waitForStatus(base, running, (s) => s.state === "cancelled");
    for (let i = 0; i < 30 && (exists(path.join(temp, "jobs", `job-${running}`)) || exists(path.join(temp, "jobs", `job-${queued}`))); i++) await sleep(50);
    assert.equal(exists(path.join(temp, "jobs", `job-${running}`)), false);
    assert.equal(exists(path.join(temp, "jobs", `job-${queued}`)), false);
  });
  await t.test("completed files expire automatically without a download", async () => {
    const id = await submit({ duration: 0.1 });
    await waitForStatus(base, id, (s) => s.state === "complete");
    const dir = path.join(temp, "jobs", `job-${id}`);
    assert.equal(exists(dir), true);
    for (let i = 0; i < 70 && exists(dir); i++) await sleep(80);
    assert.equal(exists(dir), false, "expired file should be cleaned without a request");
    assert.ok([404, 410].includes((await fetch(`${base}/api/renders/${id}`)).status));
  });
  await t.test("invalid audio fails without leaving temporary files", async () => {
    const manifest = { schemaVersion: 1, projectVersion: health.projectVersion, project: project(0.2), settings: { resolution: "test", fps: 30, quality: "standard" }, audioTracks: [{ fileIndex: 0, kind: "music", start: 0, volume: 1 }] };
    const form = new FormData();
    form.append("manifest", JSON.stringify(manifest));
    form.append("tracks", new Blob(["not actually audio"], { type: "audio/wav" }), "fake.wav");
    const response = await fetch(`${base}/api/renders`, { method: "POST", headers: { "X-Render-Request": "playback-export-v1" }, body: form });
    assert.equal(response.status, 202);
    const id = (await response.json()).id;
    const { status } = await waitForStatus(base, id, (s) => s.state === "failed");
    assert.match(status.error, /Unsupported audio file/);
    for (let i = 0; i < 20 && exists(path.join(temp, "jobs", `job-${id}`)); i++) await sleep(25);
    assert.equal(exists(path.join(temp, "jobs", `job-${id}`)), false);
  });
  await t.test("CORS permits configured origins and rejects untrusted ones and stale builds", async () => {
    const allowed = await fetch(`${base}/api/health`, { headers: { Origin: "https://frontend.example" } });
    assert.equal(allowed.headers.get("access-control-allow-origin"), "https://frontend.example");
    assert.equal(allowed.headers.get("access-control-allow-credentials"), "true");
    const proxied = await fetch(`${base}/api/health`, { headers: { Origin: "https://proxy.example", "X-Forwarded-Host": "proxy.example" } });
    assert.equal(proxied.status, 200);
    assert.equal(proxied.headers.get("access-control-allow-origin"), "https://proxy.example");
    const preflight = await fetch(`${base}/api/renders`, { method: "OPTIONS", headers: { Origin: "https://frontend.example", "Access-Control-Request-Method": "POST", "Access-Control-Request-Headers": "x-render-request" } });
    assert.equal(preflight.status, 204);
    assert.match(preflight.headers.get("access-control-allow-headers"), /X-Render-Request/);
    const blocked = await fetch(`${base}/api/health`, { headers: { Origin: "https://untrusted.example" } });
    assert.equal(blocked.status, 403);
    const form = new FormData();
    form.append("manifest", JSON.stringify({ schemaVersion: 1, projectVersion: "wrong" }));
    form.append("tracks", new Blob([musicBytes], { type: "audio/wav" }), "music.wav");
    const stale = await fetch(`${base}/api/renders`, { method: "POST", headers: { "X-Render-Request": "playback-export-v1" }, body: form });
    assert.equal(stale.status, 409);
  });
  assert.equal(await fs.access(path.join(temp, "jobs"), constants.F_OK).then(() => true, () => false), true);
});
