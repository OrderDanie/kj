import { useEffect, useRef, useState } from "react";
import { DEFAULT_AUDIO_URL } from "./audio";
import { makeProjectSnapshot, PROJECT_VERSION } from "./project";

type RenderState = "queued" | "preparing" | "rendering" | "encoding" | "cancelling" | "complete" | "downloaded" | "cancelled" | "failed" | "expired";
type Status = {
  id: string;
  state: RenderState;
  message: string;
  completedFrames: number;
  totalFrames: number;
  encodedFrames: number;
  estimatedSecondsRemaining: number | null;
  queuePosition: number | null;
  expiresAt: string | null;
  error: string | null;
  downloadUrl: string | null;
};
const apiBase = (import.meta.env.VITE_RENDER_API_URL || "").replace(/\/+$/, "");
const storageKey = "playback-cloud-export-v1";
const intent = { "X-Render-Request": "playback-export-v1" };
const activeStates: RenderState[] = ["queued", "preparing", "rendering", "encoding", "cancelling"];

function savedJob(): string | null {
  try {
    const saved = JSON.parse(localStorage.getItem(storageKey) || "null");
    return saved?.base === apiBase && /^[A-Za-z0-9_-]{32}$/.test(saved.id) ? saved.id : null;
  } catch { return null; }
}
function duration(seconds: number) {
  if (seconds < 60) return `${Math.max(1, Math.ceil(seconds))} sec`;
  if (seconds < 3600) return `${Math.ceil(seconds / 60)} min`;
  return `${Math.floor(seconds / 3600)} hr ${Math.ceil((seconds % 3600) / 60)} min`;
}
async function responseError(response: Response) {
  try { return (await response.json()).error || `Service returned ${response.status}.`; }
  catch { return `Service returned ${response.status}.`; }
}

export default function ExportDialog({ open, onClose, english, soundtrack, onSoundtrack, bundledAudio }: {
  open: boolean;
  onClose: () => void;
  english: boolean;
  soundtrack: File | null;
  onSoundtrack: (file: File) => void;
  bundledAudio: boolean;
}) {
  const [resolution, setResolution] = useState("original");
  const [fps, setFps] = useState(30);
  const [quality, setQuality] = useState("high");
  const [jobId, setJobId] = useState<string | null>(savedJob);
  const [status, setStatus] = useState<Status | null>(null);
  const [uploading, setUploading] = useState(false);
  const [localError, setLocalError] = useState("");
  const [connectionError, setConnectionError] = useState("");
  const [service, setService] = useState<{ ready: boolean; maxUploadBytes: number; projectVersion?: string } | null>(null);
  const closeRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!open) return;
    closeRef.current?.focus();
    const onKey = (event: KeyboardEvent) => { if (event.key === "Escape") onClose(); };
    window.addEventListener("keydown", onKey);
    const controller = new AbortController();
    fetch(`${apiBase}/api/health`, { signal: controller.signal, credentials: "include" })
      .then(async (r) => { if (!r.ok) throw new Error("unavailable"); return r.json(); })
      .then((data) => setService(data))
      .catch(() => { if (!controller.signal.aborted) setService({ ready: false, maxUploadBytes: 0 }); });
    return () => { controller.abort(); window.removeEventListener("keydown", onKey); };
  }, [open, onClose]);

  useEffect(() => {
    if (!jobId) return;
    let stopped = false;
    let timer: number;
    const controller = new AbortController();
    const poll = async () => {
      let again = true;
      try {
        const response = await fetch(`${apiBase}/api/renders/${jobId}`, { signal: controller.signal, credentials: "include" });
        if (response.status === 404 || response.status === 410) {
          if (!stopped) {
            setStatus({ id: jobId, state: "expired", message: "This export is no longer available.", completedFrames: 0, totalFrames: 0, encodedFrames: 0, estimatedSecondsRemaining: null, queuePosition: null, expiresAt: null, error: null, downloadUrl: null });
            localStorage.removeItem(storageKey);
          }
          again = false;
        } else if (!response.ok) throw new Error(await responseError(response));
        else {
          const data: Status = await response.json();
          if (!stopped) { setStatus(data); setConnectionError(""); }
          if (["failed", "cancelled", "downloaded", "expired"].includes(data.state)) {
            localStorage.removeItem(storageKey);
            again = false;
          }
        }
      } catch {
        if (!stopped) setConnectionError("Connection lost. Reconnecting to the render service…");
      }
      if (!stopped && again) timer = window.setTimeout(poll, 2500);
    };
    void poll();
    return () => { stopped = true; controller.abort(); window.clearTimeout(timer); };
  }, [jobId]);

  const begin = async () => {
    setLocalError("");
    setConnectionError("");
    setUploading(true);
    try {
      let track: Blob = soundtrack as File;
      let name = soundtrack?.name || "playback.mp3";
      if (!track) {
        const response = await fetch(DEFAULT_AUDIO_URL);
        if (!response.ok || !response.headers.get("content-type")?.toLowerCase().startsWith("audio/")) {
          throw new Error("The soundtrack is not bundled. Choose the original audio file before exporting.");
        }
        track = await response.blob();
        name = "playback.mp3";
      }
      if (service?.maxUploadBytes && track.size > service.maxUploadBytes) {
        throw new Error(`The soundtrack exceeds this service's ${Math.floor(service.maxUploadBytes / 1024 / 1024)} MB upload limit.`);
      }
      const manifest = {
        schemaVersion: 1, projectVersion: PROJECT_VERSION,
        project: makeProjectSnapshot(english),
        settings: { resolution, fps, quality },
        audioTracks: [{ fileIndex: 0, kind: "music", start: 0, volume: 1 }],
      };
      const form = new FormData();
      form.append("manifest", JSON.stringify(manifest));
      form.append("tracks", track, name);
      const response = await fetch(`${apiBase}/api/renders`, { method: "POST", headers: intent, body: form, credentials: "include" });
      if (!response.ok) throw new Error(await responseError(response));
      const { id } = await response.json();
      localStorage.setItem(storageKey, JSON.stringify({ id, base: apiBase }));
      setStatus(null);
      setJobId(id);
    } catch (error) {
      setLocalError(error instanceof Error ? error.message : "Could not start the export.");
    } finally { setUploading(false); }
  };
  const cancel = async () => {
    if (!jobId) return;
    try {
      const response = await fetch(`${apiBase}/api/renders/${jobId}`, { method: "DELETE", headers: intent, credentials: "include" });
      if (!response.ok) throw new Error(await responseError(response));
      setStatus(await response.json());
    } catch (error) { setLocalError(error instanceof Error ? error.message : "Could not cancel the export."); }
  };
  const reset = () => { localStorage.removeItem(storageKey); setJobId(null); setStatus(null); setLocalError(""); setConnectionError(""); };
  if (!open) return null;
  const running = uploading || (jobId !== null && (!status || activeStates.includes(status.state)));
  const percent = status?.totalFrames ? Math.floor(status.completedFrames / status.totalFrames * 100) : 0;
  const selectClass = "mt-1.5 w-full rounded-sm border border-[#d8ccb2]/25 bg-[#17181d] px-3 py-2.5 text-sm text-[#efe6d2] outline-none focus:border-[#d3a24c]";

  return (
    <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/75 p-4" onClick={onClose}>
      <section role="dialog" aria-modal="true" aria-labelledby="export-title" className="max-h-[calc(100vh-2rem)] w-full max-w-[600px] overflow-y-auto border border-[#d8ccb2]/30 bg-[#0c0d11] p-5 text-[#efe6d2] shadow-2xl sm:p-7" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="font-mono text-[10px] tracking-[0.25em] text-[#c49a3c]">ARCHIVE / CLOUD RENDER</p>
            <h2 id="export-title" className="mt-1 text-2xl font-black">Export MP4</h2>
            <p className="mt-1 text-xs leading-relaxed text-[#d8ccb2]/70">The full film is rendered frame by frame on the server, not on your device.</p>
          </div>
          <button ref={closeRef} onClick={onClose} aria-label="Close export dialog" className="px-2 text-2xl leading-none text-[#d8ccb2]/70 hover:text-white">×</button>
        </div>

        {!jobId && !uploading && <>
          <div className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-3">
            <label className="font-mono text-[10px] tracking-widest text-[#d8ccb2]/80">RESOLUTION
              <select aria-label="Resolution" className={selectClass} value={resolution} onChange={(e) => setResolution(e.target.value)}>
                <option value="original">Original (1080p)</option><option value="1080p">1080p</option><option value="1440p">1440p</option><option value="4k">4K</option>
              </select>
            </label>
            <label className="font-mono text-[10px] tracking-widest text-[#d8ccb2]/80">FRAME RATE
              <select aria-label="Frame rate" className={selectClass} value={fps} onChange={(e) => setFps(Number(e.target.value))}>
                <option value={30}>30 FPS</option><option value={60}>60 FPS</option>
              </select>
            </label>
            <label className="font-mono text-[10px] tracking-widest text-[#d8ccb2]/80">QUALITY
              <select aria-label="Quality" className={selectClass} value={quality} onChange={(e) => setQuality(e.target.value)}>
                <option value="standard">Standard</option><option value="high">High</option>
              </select>
            </label>
          </div>
          <div className="mt-5 border border-[#d8ccb2]/15 bg-[#17181d] p-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="min-w-0">
                <p className="font-mono text-[10px] tracking-widest text-[#c49a3c]">SOUNDTRACK</p>
                <p className="mt-1 break-all text-xs text-[#efe6d2]">{soundtrack?.name || (bundledAudio ? "Bundled playback.mp3" : "Original audio file required")}</p>
              </div>
              <label className="cursor-pointer border border-[#d8ccb2]/30 px-3 py-2 font-mono text-[10px] tracking-widest text-[#d8ccb2] hover:border-[#d3a24c] hover:text-[#d3a24c]">
                CHOOSE AUDIO<input className="sr-only" type="file" accept="audio/*,.mp3,.wav,.m4a,.flac,.ogg,.webm,.aiff" onChange={(e) => { const file = e.target.files?.[0]; if (file) onSoundtrack(file); e.target.value = ""; }} />
              </label>
            </div>
            <p className="mt-2 text-[11px] leading-relaxed text-[#d8ccb2]/60">Upload the original soundtrack, including any effects or voiceovers. Audio is included even if the player is muted.</p>
          </div>
          <p className="mt-3 text-[11px] text-[#d8ccb2]/60">Original: 1920×1080 · English gloss: {english ? "on" : "off"} · H.264 / yuv420p · AAC audio</p>
        </>}

        {(uploading || jobId) && <div className="mt-6 border border-[#d8ccb2]/15 bg-[#17181d] p-4" aria-live="polite">
          <div className="flex items-center justify-between gap-3">
            <p className="text-sm font-bold">{uploading ? "Uploading project & audio…" : status?.message || "Connecting to render…"}</p>
            {status?.state === "rendering" && <span className="font-mono text-sm text-[#d3a24c]">{percent}%</span>}
          </div>
          {status && ["rendering", "encoding", "complete", "downloaded"].includes(status.state) && <>
            <div className="mt-3 h-1.5 overflow-hidden bg-[#d8ccb2]/15" role="progressbar" aria-label="Frames captured" aria-valuemin={0} aria-valuemax={100} aria-valuenow={percent}>
              <div className="h-full bg-[#d3a24c] transition-[width]" style={{ width: `${percent}%` }} />
            </div>
            <p className="mt-2 font-mono text-[11px] text-[#d8ccb2]/70">{status.completedFrames.toLocaleString()} / {status.totalFrames.toLocaleString()} frames captured{status.estimatedSecondsRemaining !== null && status.state === "rendering" ? ` · approx. ${duration(status.estimatedSecondsRemaining)} capture remaining` : ""}</p>
          </>}
          {status?.state === "queued" && <p className="mt-2 text-xs text-[#d8ccb2]/70">Queue position: {status.queuePosition}. The estimate will appear once capture begins.</p>}
          {status?.state === "encoding" && <p className="mt-2 text-xs text-[#d8ccb2]/70">All frames captured. FFmpeg is finishing the video and audio.</p>}
          {status?.state === "complete" && status.expiresAt && <p className="mt-2 text-xs text-[#d8ccb2]/70">Available until {new Date(status.expiresAt).toLocaleString()}. The server deletes it after a successful download.</p>}
          {status?.error && <p className="mt-2 text-xs text-[#e497a2]">{status.error}</p>}
          {connectionError && <p className="mt-2 text-xs text-[#e497a2]">{connectionError}</p>}
        </div>}
        {localError && <p role="alert" className="mt-4 text-xs leading-relaxed text-[#e497a2]">{localError}</p>}
        {!jobId && !uploading && service && !service.ready && <p className="mt-4 text-xs text-[#e497a2]">Cloud renderer unavailable. Start or deploy the rendering service and try again.</p>}
        {!jobId && !uploading && service?.ready && service.projectVersion !== PROJECT_VERSION && <p className="mt-4 text-xs text-[#e497a2]">The cloud renderer has a different project version. Redeploy it to match this app.</p>}

        <div className="mt-5 flex flex-wrap items-center gap-3">
          {!jobId && <button onClick={() => void begin()} disabled={uploading || !service?.ready || service.projectVersion !== PROJECT_VERSION || (!soundtrack && !bundledAudio)} className="bg-[#d3a24c] px-5 py-3 text-xs font-black tracking-widest text-[#17171c] hover:bg-[#e0b866] disabled:cursor-not-allowed disabled:opacity-40">{uploading ? "UPLOADING…" : "START CLOUD RENDER"}</button>}
          {jobId && status?.state === "complete" && status.downloadUrl && <a href={`${apiBase}${status.downloadUrl}`} download="playback.mp4" rel="noreferrer" className="bg-[#d3a24c] px-5 py-3 text-xs font-black tracking-widest text-[#17171c] hover:bg-[#e0b866]">DOWNLOAD MP4 ↓</a>}
          {jobId && status && activeStates.includes(status.state) && status.state !== "cancelling" && <button onClick={() => void cancel()} className="border border-[#d8ccb2]/30 px-4 py-3 font-mono text-[10px] tracking-widest text-[#d8ccb2] hover:border-[#e497a2] hover:text-[#e497a2]">CANCEL RENDER</button>}
          {jobId && status && !activeStates.includes(status.state) && <button onClick={reset} className="border border-[#d8ccb2]/30 px-4 py-3 font-mono text-[10px] tracking-widest text-[#d8ccb2] hover:border-[#d3a24c]">NEW EXPORT</button>}
          <button onClick={onClose} className="px-2 py-3 font-mono text-[10px] tracking-widest text-[#d8ccb2]/60 hover:text-[#efe6d2]">CLOSE</button>
        </div>
        <p className="mt-4 text-[11px] leading-relaxed text-[#d8ccb2]/50">{running ? "You can close this window or refresh the page. This browser will remember the job." : "Render times vary, especially at 4K or 60 FPS. Temporary files are deleted after download or expiry."}</p>
      </section>
    </div>
  );
}
