export const ORIGINAL_DURATION = 149.5;
export const MAX_TRACKS = 4;
export const RESOLUTIONS = Object.freeze({
  original: { width: 1920, height: 1080 },
  "1080p": { width: 1920, height: 1080 },
  "1440p": { width: 2560, height: 1440 },
  "4k": { width: 3840, height: 2160 },
});

export class RequestError extends Error {
  constructor(message, status = 400) { super(message); this.status = status; }
}
const finite = (x) => typeof x === "number" && Number.isFinite(x);
const fail = (message) => { throw new RequestError(message); };

/** Accept only data, never HTML, URLs, scripts, shell arguments or client paths. */
export function validateManifest(value, files, version, { testMode = false, maxUploadBytes = 80 * 1024 * 1024 } = {}) {
  if (!value || typeof value !== "object" || value.schemaVersion !== 1) fail("Invalid render manifest.");
  if (value.projectVersion !== version) {
    throw new RequestError("The export service has a different project version. Update the frontend or redeploy the service.", 409);
  }
  const { project, settings, audioTracks } = value;
  if (!project || project.width !== 1920 || project.height !== 1080 || typeof project.showEnglish !== "boolean") fail("Invalid project dimensions or settings.");
  if (!finite(project.duration) || project.duration <= 0 || project.duration > ORIGINAL_DURATION ||
      (!testMode && project.duration !== ORIGINAL_DURATION) || (testMode && project.duration > 2)) fail("Invalid project duration.");
  if (!Array.isArray(project.scenes) || project.scenes.length < 1 || project.scenes.length > 100) fail("Invalid animation timeline.");
  let lastEnd = 0;
  const ids = new Set();
  for (const scene of project.scenes) {
    if (!scene || typeof scene.id !== "string" || !/^[a-z0-9_-]{1,40}$/.test(scene.id) || ids.has(scene.id) ||
        !finite(scene.start) || !finite(scene.end) || Math.abs(scene.start - lastEnd) > 0.00001 ||
        scene.end <= scene.start || scene.end > ORIGINAL_DURATION) fail("Invalid animation scene.");
    ids.add(scene.id);
    lastEnd = scene.end;
  }
  if (lastEnd !== ORIGINAL_DURATION) fail("The animation timeline is incomplete.");
  if (!Array.isArray(project.lyrics) || project.lyrics.length > 200) fail("Invalid lyrics.");
  let lastLyricEnd = 0;
  for (const line of project.lyrics) {
    if (!line || !finite(line.s) || !finite(line.e) || line.s < lastLyricEnd || line.e <= line.s || line.e > ORIGINAL_DURATION ||
        typeof line.jp !== "string" || line.jp.length < 1 || line.jp.length > 300 ||
        typeof line.en !== "string" || line.en.length > 500 || (line.hot !== undefined && typeof line.hot !== "boolean")) fail("Invalid lyric data.");
    lastLyricEnd = line.e;
  }
  const resolution = testMode && settings?.resolution === "test" ? { width: 320, height: 180 } :
    Object.hasOwn(RESOLUTIONS, settings?.resolution) ? RESOLUTIONS[settings.resolution] : null;
  if (!resolution || ![30, 60].includes(settings?.fps) || !["standard", "high"].includes(settings?.quality)) fail("Invalid export settings.");
  if (!Array.isArray(files) || files.length < 1 || files.length > MAX_TRACKS || !Array.isArray(audioTracks) || audioTracks.length !== files.length) fail("The project needs its soundtrack audio.");
  if (files.some((f) => !f.size) || files.reduce((sum, f) => sum + f.size, 0) > maxUploadBytes) fail("The audio upload is empty or too large.");
  const indexes = new Set();
  for (const track of audioTracks) {
    if (!track || !Number.isInteger(track.fileIndex) || track.fileIndex < 0 || track.fileIndex >= files.length || indexes.has(track.fileIndex) ||
        !finite(track.start) || track.start < 0 || track.start >= project.duration || !finite(track.volume) || track.volume < 0 || track.volume > 2 ||
        !["music", "sound", "voice"].includes(track.kind)) fail("Invalid audio track.");
    indexes.add(track.fileIndex);
  }
  return { project, settings, audioTracks, resolution, totalFrames: Math.ceil(project.duration * settings.fps) };
}
