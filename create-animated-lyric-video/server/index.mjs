import express from "express";
import multer from "multer";
import crypto from "node:crypto";
import fs from "node:fs/promises";
import { constants as fsConstants } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { spawn } from "node:child_process";
import { chromium } from "playwright";
import { MAX_TRACKS, RequestError, validateManifest } from "./validation.mjs";
import { renderJob } from "./renderer.mjs";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const dist = path.join(root, "dist");
const storage = path.resolve(process.env.RENDER_STORAGE_DIR || "/tmp/playback-renders");
const integer = (name, fallback, min, max) => {
  const n = Number(process.env[name]);
  return Number.isInteger(n) && n >= min && n <= max ? n : fallback;
};
const config = {
  port: integer("PORT", 3001, 0, 65535),
  host: process.env.HOST || "0.0.0.0",
  ffmpeg: process.env.FFMPEG_PATH || "ffmpeg",
  ffprobe: process.env.FFPROBE_PATH || "ffprobe",
  chromiumPath: process.env.CHROMIUM_EXECUTABLE_PATH || "",
  chromiumSandbox: process.env.CHROMIUM_SANDBOX === "1",
  trustProxy: process.env.TRUST_PROXY === "1",
  maxRunning: integer("MAX_RUNNING_JOBS", 1, 1, 4),
  maxQueued: integer("MAX_QUEUED_JOBS", 2, 0, 20),
  maxUploadBytes: integer("MAX_UPLOAD_MB", 80, 1, 512) * 1024 * 1024,
  ttlMs: (integer("RENDER_TTL_SECONDS", 0, 0, 86400) || integer("RENDER_TTL_MINUTES", 60, 1, 1440) * 60) * 1000,
  timeoutMs: integer("RENDER_TIMEOUT_MINUTES", 480, 1, 1440) * 60000,
  testMode: process.env.RENDER_TEST_MODE === "1",
};
const allowedOrigins = new Set((process.env.ALLOWED_ORIGINS || "").split(",").map((s) => s.trim()).filter(Boolean));
const { version } = JSON.parse(await fs.readFile(path.join(dist, "render-version.json"), "utf8").catch(() => {
  throw new Error("Build the frontend first: npm run build");
}));
await fs.mkdir(storage, { recursive: true, mode: 0o700 });
// Jobs are intentionally in memory and do not survive a restart. This storage
// directory must belong to one service instance, not a shared multi-node volume.
for (const entry of await fs.readdir(storage, { withFileTypes: true })) {
  if (entry.isDirectory() && /^job-[A-Za-z0-9_-]{32}$/.test(entry.name)) {
    await fs.rm(path.join(storage, entry.name), { recursive: true, force: true });
  }
}

function commandAvailable(command) {
  return new Promise((resolve) => {
    const p = spawn(command, ["-version"], { stdio: "ignore" });
    const timer = setTimeout(() => { p.kill("SIGKILL"); resolve(false); }, 10000);
    p.on("error", () => { clearTimeout(timer); resolve(false); });
    p.on("close", (code) => { clearTimeout(timer); resolve(code === 0); });
  });
}
function ffmpegHasEncoders(command) {
  return new Promise((resolve) => {
    const p = spawn(command, ["-hide_banner", "-encoders"], { stdio: ["ignore", "pipe", "pipe"] });
    let output = "";
    const timer = setTimeout(() => { p.kill("SIGKILL"); resolve(false); }, 10000);
    p.stdout.on("data", (chunk) => { output += chunk; });
    p.on("error", () => { clearTimeout(timer); resolve(false); });
    p.on("close", (code) => { clearTimeout(timer); resolve(code === 0 && /\blibx264\b/.test(output) && /\baac\b/.test(output)); });
  });
}
async function browserAvailable() {
  try {
    await fs.access(config.chromiumPath || chromium.executablePath(), fsConstants.X_OK);
    const instance = await chromium.launch({ headless: true, executablePath: config.chromiumPath || undefined,
      chromiumSandbox: config.chromiumSandbox, args: ["--disable-dev-shm-usage"], timeout: 15000 });
    await instance.close();
    return true;
  } catch (error) {
    console.warn("Chromium readiness check failed:", error.message);
    return false;
  }
}
const deps = await Promise.all([ffmpegHasEncoders(config.ffmpeg), commandAvailable(config.ffprobe), browserAvailable()]);
const ready = deps.every(Boolean);
if (!ready) console.warn(`Rendering dependencies missing: ${["ffmpeg", "ffprobe", "Chromium"].filter((_, i) => !deps[i]).join(", ")}`);

async function removeJobDir(dir) {
  try { await fs.rm(dir, { recursive: true, force: true }); }
  catch (error) { console.error("Temporary-file cleanup failed:", error.message); }
}

const jobs = new Map();
const queue = [];
let running = 0, uploads = 0, internalOrigin;
const app = express();
app.disable("x-powered-by");
app.use((req, res, next) => {
  res.set({ "X-Content-Type-Options": "nosniff", "Referrer-Policy": "no-referrer" });
  if (req.path.startsWith("/api/")) res.set("Cache-Control", "no-store");
  const origin = req.get("Origin");
  if (origin) {
    let sameHost = false;
    try {
      const url = new URL(origin);
      const host = (req.get("Host") || "").toLowerCase();
      const forwardedHost = config.trustProxy ? (req.get("X-Forwarded-Host") || "").split(",").at(-1).trim().toLowerCase() : "";
      sameHost = ["http:", "https:"].includes(url.protocol) && (url.host === host || Boolean(forwardedHost && url.host === forwardedHost));
    } catch { /* invalid origin */ }
    if (!sameHost && !allowedOrigins.has(origin)) return res.status(403).json({ error: "This origin is not allowed by the rendering service." });
    res.set({ "Access-Control-Allow-Origin": origin, "Access-Control-Allow-Credentials": "true", "Vary": "Origin" });
  }
  if (req.method === "OPTIONS" && req.path.startsWith("/api/")) {
    res.set({ "Access-Control-Allow-Methods": "GET, POST, DELETE, OPTIONS", "Access-Control-Allow-Headers": "Content-Type, X-Render-Request", "Access-Control-Max-Age": "600" });
    return res.sendStatus(204);
  }
  next();
});
const requireIntent = (req, res, next) => req.get("X-Render-Request") === "playback-export-v1"
  ? next() : res.status(400).json({ error: "Missing render request header." });

app.get("/api/health", (_req, res) => res.status(ready ? 200 : 503).json({ ready, projectVersion: version, maxUploadBytes: config.maxUploadBytes }));

const upload = multer({
  storage: multer.diskStorage({
    destination: (req, _file, cb) => cb(null, req.uploadDir),
    filename: (_req, _file, cb) => cb(null, crypto.randomBytes(16).toString("hex") + ".upload"),
  }),
  limits: { fileSize: config.maxUploadBytes, files: MAX_TRACKS, fields: 1, fieldSize: 256 * 1024, parts: MAX_TRACKS + 1 },
}).array("tracks", MAX_TRACKS);

app.post("/api/renders", requireIntent, async (req, res) => {
  if (!ready) return res.status(503).json({ error: "The render service is missing FFmpeg, FFprobe or Chromium. Contact the service operator." });
  if (running + queue.length + uploads >= config.maxRunning + config.maxQueued) return res.status(429).json({ error: "The render queue is full. Please try again later." });
  const contentLength = Number(req.get("Content-Length"));
  if (contentLength > config.maxUploadBytes + 512 * 1024) return res.status(413).json({ error: "The audio upload is too large." });
  const id = crypto.randomBytes(24).toString("base64url");
  const dir = path.join(storage, `job-${id}`);
  // Reserve capacity before the first asynchronous operation so simultaneous
  // uploads cannot all pass the queue limit.
  uploads++;
  try { await fs.mkdir(dir, { mode: 0o700 }); }
  catch (error) { uploads--; throw error; }
  if (req.aborted || res.destroyed) { uploads--; await removeJobDir(dir); return; }
  req.uploadDir = dir;
  let received = 0, finished = false;
  req.on("data", (chunk) => {
    received += chunk.length;
    // Also enforce a total limit on chunked/multiple-file uploads.
    if (received > config.maxUploadBytes + 512 * 1024 && !req.destroyed) req.destroy(new Error("Upload too large"));
  });
  req.on("aborted", () => { if (!finished) void removeJobDir(dir); });
  upload(req, res, async (err) => {
    uploads--;
    if (err || req.aborted) {
      finished = true;
      await removeJobDir(dir);
      if (!res.headersSent && !res.destroyed) res.status(err?.code === "LIMIT_FILE_SIZE" ? 413 : 400).json({ error: "Audio upload failed or exceeded the size limit." });
      return;
    }
    try {
      let manifest;
      try { manifest = JSON.parse(req.body.manifest); } catch { throw new RequestError("Invalid render manifest."); }
      const files = req.files || [];
      const validated = validateManifest(manifest, files, version, config);
      const job = {
        id, dir, files, manifest: validated, projectVersion: manifest.projectVersion,
        controller: new AbortController(), state: "queued", message: "Waiting for a renderer",
        completedFrames: 0, encodedFrames: 0, estimatedSecondsRemaining: null,
        createdAt: Date.now(), expiresAt: null, error: null, downloading: false,
      };
      jobs.set(id, job);
      queue.push(job);
      finished = true;
      res.status(202).json({ id, state: job.state });
      setImmediate(runNext);
    } catch (error) {
      finished = true;
      await removeJobDir(dir);
      res.status(error instanceof RequestError ? error.status : 500).json({ error: error instanceof RequestError ? error.message : "Unable to create the render." });
    }
  });
});

function publicStatus(job) {
  const queuePosition = job.state === "queued" ? queue.indexOf(job) + 1 : null;
  return {
    id: job.id, state: job.state, message: job.message, completedFrames: job.completedFrames,
    totalFrames: job.manifest.totalFrames, encodedFrames: job.encodedFrames,
    estimatedSecondsRemaining: job.estimatedSecondsRemaining, queuePosition,
    createdAt: new Date(job.createdAt).toISOString(),
    expiresAt: job.expiresAt ? new Date(job.expiresAt).toISOString() : null,
    error: job.error,
    downloadUrl: job.state === "complete" ? `/api/renders/${job.id}/download` : null,
  };
}
const getJob = (req, res, next) => {
  if (!/^[A-Za-z0-9_-]{32}$/.test(req.params.id)) return res.status(404).json({ error: "Export not found or expired." });
  const job = jobs.get(req.params.id);
  if (!job) return res.status(404).json({ error: "Export not found or expired." });
  if (job.expiresAt && job.expiresAt <= Date.now() && !job.downloading) {
    jobs.delete(job.id);
    void removeJobDir(job.dir);
    return res.status(410).json({ error: "Export expired and its temporary files were deleted." });
  }
  req.job = job;
  next();
};
app.get("/api/renders/:id", getJob, (req, res) => res.json(publicStatus(req.job)));
app.delete("/api/renders/:id", requireIntent, getJob, async (req, res) => {
  const job = req.job;
  if (job.downloading) return res.status(409).json({ error: "The file is being downloaded." });
  if (job.state === "queued") {
    const pos = queue.indexOf(job);
    if (pos !== -1) queue.splice(pos, 1);
    job.state = "cancelled"; job.message = "Export cancelled"; job.expiresAt = Date.now() + config.ttlMs;
    await removeJobDir(job.dir);
  } else if (["preparing", "rendering", "encoding", "cancelling"].includes(job.state)) {
    job.state = "cancelling"; job.message = "Cancelling export"; job.controller.abort();
  } else {
    job.state = "cancelled"; job.message = "Export deleted"; job.expiresAt = Date.now() + config.ttlMs;
    await removeJobDir(job.dir);
  }
  res.json(publicStatus(job));
});
app.get("/api/renders/:id/download", getJob, (req, res) => {
  const job = req.job;
  if (job.state !== "complete" || job.downloading) return res.status(409).json({ error: "The export is not available for download." });
  job.downloading = true;
  res.download(job.output, "playback.mp4", { acceptRanges: false }, (err) => {
    job.downloading = false;
    if (!err) {
      job.state = "downloaded";
      job.message = "Download complete; temporary files removed";
      job.expiresAt = Date.now() + config.ttlMs;
      void removeJobDir(job.dir);
    } else if (!res.headersSent) res.status(500).json({ error: "Download failed; please try again." });
  });
});

function runNext() {
  while (running < config.maxRunning && queue.length) {
    const job = queue.shift();
    if (job.state !== "queued") continue;
    running++;
    job.state = "preparing";
    job.message = "Preparing the render";
    const timer = setTimeout(() => { job.timedOut = true; job.controller.abort(); }, config.timeoutMs);
    const update = (patch) => { if (job.state !== "cancelling") Object.assign(job, patch); };
    renderJob(job, config, internalOrigin, update, job.controller.signal).then(async (output) => {
      if (job.controller.signal.aborted) throw new Error("Render cancelled.");
      await Promise.all([...job.files.map((f) => fs.rm(f.path, { force: true })), fs.rm(path.join(job.dir, "mixed-audio.wav"), { force: true })]);
      if (job.controller.signal.aborted) throw new Error("Render cancelled.");
      job.output = output;
      job.state = "complete";
      job.message = "MP4 ready to download";
      job.expiresAt = Date.now() + config.ttlMs;
    }).catch(async (error) => {
      const cancelled = job.controller.signal.aborted;
      if (!cancelled) console.error("Render failed:", error.message, error.detail || "");
      job.state = cancelled && !job.timedOut ? "cancelled" : "failed";
      job.message = job.state === "cancelled" ? "Export cancelled" : "Export failed";
      job.error = job.timedOut ? "The render exceeded the service time limit." : cancelled ? null :
        (/^(Unsupported audio file|The uploaded file does not contain|Audio processing failed|Audio processing timed out|The server renderer and uploaded)/.test(error.message)
          ? error.message : "Rendering failed. Please try again or contact the service operator.");
      job.expiresAt = Date.now() + config.ttlMs;
      await removeJobDir(job.dir);
    }).finally(() => { clearTimeout(timer); running--; runNext(); });
  }
}

const sweep = setInterval(() => {
  const now = Date.now();
  for (const job of jobs.values()) if (job.expiresAt && job.expiresAt <= now && !job.downloading) {
    jobs.delete(job.id);
    void removeJobDir(job.dir);
  }
}, Math.max(1000, Math.min(30000, Math.floor(config.ttlMs / 4))));
sweep.unref();

// The same build can serve the user-facing frontend and the private renderer.
app.get(["/", "/__render"], (_req, res) => res.sendFile(path.join(dist, "index.html")));
app.use(express.static(dist, { index: false, fallthrough: true }));
app.use((_req, res) => res.status(404).json({ error: "Not found." }));
app.use((err, _req, res, _next) => { console.error(err); if (!res.headersSent) res.status(500).json({ error: "Service error." }); });
const server = app.listen(config.port, config.host, () => {
  const address = server.address();
  internalOrigin = `http://127.0.0.1:${address.port}`;
  console.log(`Playback render service listening on ${config.host}:${address.port} (ready: ${ready})`);
});
const shutdown = () => {
  for (const job of jobs.values()) job.controller.abort();
  server.close(() => process.exit(0));
  setTimeout(() => process.exit(1), 10000).unref();
};
process.once("SIGTERM", shutdown);
process.once("SIGINT", shutdown);
