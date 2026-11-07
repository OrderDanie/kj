import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { AISigil, MikuSigil, TieSigil, UiSigil } from "./parts";
import { DURATION, FONT_JP, clamp } from "./lib";
import { FilmStage } from "./Film";
import { makeProjectSnapshot } from "./project";
import { DEFAULT_AUDIO_URL } from "./audio";
import ExportDialog from "./ExportDialog";

const fmt = (s: number) => `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, "0")}`;
/* ───────────── small symbol legend for the start screen ───────────── */
const Legend = () => {
  const items: { n: string; el: React.ReactNode }[] = [
    { n: "Miku", el: <MikuSigil /> },
    { n: "Ui", el: <UiSigil /> },
    { n: "Him", el: <TieSigil /> },
    { n: "AIs", el: (<g><g transform="translate(-70 0) scale(.8)"><AISigil kind="spark" /></g><g transform="translate(70 0) scale(.8)"><AISigil kind="aster" /></g></g>) },
  ];
  return (
    <div className="flex items-end justify-center gap-5">
      {items.map((i) => (
        <div key={i.n} className="flex flex-col items-center gap-1">
          <svg viewBox="-190 -140 380 370" width="62" height="60">{i.el}</svg>
          <span className="text-[11px] tracking-widest text-[#d8ccb2]/80 uppercase">{i.n}</span>
        </div>
      ))}
    </div>
  );
};

export default function App() {
  const [view, setView] = useState({ t: 0, e: 0 });
  const [started, setStarted] = useState(false);
  const [playing, setPlaying] = useState(false);
  const [muted, setMuted] = useState(false);
  const [en, setEn] = useState(true);
  const [dim, setDim] = useState({ w: window.innerWidth, h: window.innerHeight });
  const [uiShown, setUiShown] = useState(true);
  const [audioOk, setAudioOk] = useState(true);
  const [soundtrack, setSoundtrack] = useState<File | null>(null);
  const [bundledAudio, setBundledAudio] = useState(false);
  const [exportOpen, setExportOpen] = useState(false);
  const closeExport = useCallback(() => setExportOpen(false), []);

  const st = useRef({ t: 0, playing: false, last: 0, e: 0 });
  const audio = useRef<HTMLAudioElement | null>(null);
  const soundtrackUrl = useRef<string | null>(null);
  const analyser = useRef<AnalyserNode | null>(null);
  const bins = useRef<Uint8Array | null>(null);
  const ctxRef = useRef<AudioContext | null>(null);
  const idle = useRef<number>(0);
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const onR = () => setDim({ w: window.innerWidth, h: window.innerHeight });
    window.addEventListener("resize", onR);
    return () => window.removeEventListener("resize", onR);
  }, []);


  useEffect(() => {
    const controller = new AbortController();
    fetch(DEFAULT_AUDIO_URL, { method: "HEAD", signal: controller.signal })
      .then((r) => setBundledAudio(r.ok && Boolean(r.headers.get("content-type")?.toLowerCase().startsWith("audio/"))))
      .catch(() => {});
    return () => controller.abort();
  }, []);

  useEffect(() => () => {
    audio.current?.pause();
    if (soundtrackUrl.current) URL.revokeObjectURL(soundtrackUrl.current);
    void ctxRef.current?.close();
  }, []);

  const chooseSoundtrack = useCallback((file: File) => {
    const oldUrl = soundtrackUrl.current;
    const url = URL.createObjectURL(file);
    soundtrackUrl.current = url;
    setSoundtrack(file);
    setAudioOk(true);
    const a = audio.current;
    if (a) {
      a.pause();
      a.onloadedmetadata = () => {
        a.currentTime = Math.min(st.current.t, Math.max(0, a.duration - 0.05));
        if (st.current.playing) void a.play().catch(() => setAudioOk(false));
      };
      a.src = url;
      a.load();
    }
    if (oldUrl) URL.revokeObjectURL(oldUrl);
  }, []);

  /* master clock — locked to the audio element while the song plays */
  useEffect(() => {
    let raf = 0;
    const loop = (now: number) => {
      const s = st.current;
      const dt = Math.min(0.1, (now - s.last) / 1000);
      s.last = now;
      if (s.playing) {
        const a = audio.current;
        if (a && !a.paused && !a.ended && a.readyState >= 2) s.t = a.currentTime;
        else if (a && !a.paused && !a.ended) { /* buffering: hold */ }
        else s.t += dt; // song finished: let the outro play out
        if (s.t >= DURATION) {
          s.t = DURATION;
          s.playing = false;
          setPlaying(false);
        }
      }
      let e = 0;
      if (analyser.current && bins.current && s.playing) {
        analyser.current.getByteFrequencyData(bins.current as Uint8Array<ArrayBuffer>);
        let sum = 0;
        for (let i = 1; i < 9; i++) sum += bins.current[i];
        e = clamp((sum / 8 / 255 - 0.42) / 0.4);
      }
      s.e = s.e * 0.6 + e * 0.4;
      setView({ t: s.t, e: s.e });
      if (!s.playing && performance.now() - idle.current > 3000) setUiShown(true);
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame((n) => { st.current.last = n; loop(n); });
    return () => cancelAnimationFrame(raf);
  }, []);

  const ensureAudio = useCallback(() => {
    if (audio.current) return audio.current;
    const a = new Audio(soundtrackUrl.current || DEFAULT_AUDIO_URL);
    a.preload = "auto";
    a.addEventListener("error", () => setAudioOk(false));
    audio.current = a;
    try {
      const AC = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      const ctx = new AC();
      const src = ctx.createMediaElementSource(a);
      const an = ctx.createAnalyser();
      an.fftSize = 256;
      an.smoothingTimeConstant = 0.55;
      src.connect(an);
      an.connect(ctx.destination);
      analyser.current = an;
      bins.current = new Uint8Array(an.frequencyBinCount);
      ctxRef.current = ctx;
    } catch { /* plain element playback still works */ }
    return a;
  }, []);

  const play = useCallback(async () => {
    const a = ensureAudio();
    ctxRef.current?.resume();
    const s = st.current;
    if (s.t >= DURATION - 0.05) { s.t = 0; }
    a.muted = muted;
    const adur = a.duration || 143.5;
    if (s.t < adur - 0.2) {
      if (Math.abs(a.currentTime - s.t) > 0.1) a.currentTime = s.t;
      try { await a.play(); } catch { setAudioOk(false); }
    }
    s.last = performance.now();
    s.playing = true;
    setPlaying(true);
    setStarted(true);
  }, [ensureAudio, muted]);

  const pause = useCallback(() => {
    audio.current?.pause();
    st.current.playing = false;
    setPlaying(false);
  }, []);

  const seek = useCallback((x: number) => {
    const s = st.current;
    s.t = clamp(x, 0, DURATION);
    const a = audio.current;
    if (a) {
      const adur = a.duration || 143.5;
      a.currentTime = Math.min(s.t, adur - 0.05);
      if (s.playing) {
        if (s.t < adur - 0.2) a.play().catch(() => {});
        else a.pause();
      }
    }
    setView((v) => ({ ...v, t: s.t }));
  }, []);

  const toggle = useCallback(() => { if (st.current.playing) pause(); else void play(); }, [pause, play]);

  const toggleMute = useCallback(() => {
    setMuted((m) => { if (audio.current) audio.current.muted = !m; return !m; });
  }, []);

  const fullscreen = useCallback(() => {
    if (document.fullscreenElement) void document.exitFullscreen();
    else void rootRef.current?.requestFullscreen?.();
  }, []);

  useEffect(() => {
    const onKey = (ev: KeyboardEvent) => {
      if (exportOpen || (ev.target instanceof HTMLElement && /^(INPUT|SELECT|TEXTAREA|BUTTON)$/.test(ev.target.tagName))) return;
      if (ev.code === "Space") { ev.preventDefault(); if (started) toggle(); else void play(); }
      else if (ev.key === "ArrowRight") seek(st.current.t + 5);
      else if (ev.key === "ArrowLeft") seek(st.current.t - 5);
      else if (ev.key.toLowerCase() === "m") toggleMute();
      else if (ev.key.toLowerCase() === "f") fullscreen();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [started, toggle, play, seek, toggleMute, fullscreen, exportOpen]);

  const poke = () => { idle.current = performance.now(); setUiShown(true); };
  useEffect(() => {
    if (!playing) return;
    const id = window.setInterval(() => { if (performance.now() - idle.current > 2800) setUiShown(false); }, 500);
    return () => window.clearInterval(id);
  }, [playing]);

  const { t, e } = view;
  const ended = t >= DURATION - 0.01 && !playing;
  const snapshot = useMemo(() => makeProjectSnapshot(en), [en]);
  const pct = (t / DURATION) * 100;

  return (
    <div ref={rootRef} className="relative h-full w-full select-none overflow-hidden bg-black" onMouseMove={poke} onClick={poke}>
      {/* the shared 1920×1080 stage */}
      <FilmStage t={t} e={e} started={started} snapshot={snapshot} width={dim.w} height={dim.h} onClick={() => started && toggle()} />

      {/* start screen */}
      {!started && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/55 px-4">
          <div className="rise max-h-[calc(100vh-2rem)] w-full max-w-[640px] overflow-y-auto border border-[#d8ccb2]/30 bg-[#0c0d11]/90 p-7 text-[#efe6d2] shadow-2xl backdrop-blur-sm sm:p-9">
            <div className="mb-3 flex items-center justify-between font-mono text-[11px] tracking-[0.25em] text-[#c49a3c]">
              <span>日本異変調査局 特任研究班</span>
              <span className="border border-[#a23a4c] px-2 py-0.5 text-[#cf6b7b]">最高機密</span>
            </div>
            <h1 className="text-5xl font-black leading-none sm:text-6xl" style={{ fontFamily: FONT_JP }}>プレイバック</h1>
            <p className="mt-1 font-mono text-lg tracking-[0.3em] text-[#d8ccb2]">PLAYBACK</p>
            <p className="mt-3 text-sm text-[#d8ccb2]/80">feat. 初音ミク, 雨衣 &nbsp;·&nbsp; うちのボカロは様子がおかしい</p>
            <div className="my-5 h-px bg-[#d8ccb2]/20" />
            <p className="text-[13px] leading-relaxed text-[#efe6d2]/85">
              Case file 141226 — <b>Exorcism Research Project.</b> The Bureau takes the most obedient child from an orphanage
              and tests crosses, chants and distances on her. The researchers’ reward: forbidden classical music, whose
              melody can <i>rewind time</i> when sung. Every time she hums it, the lights go out… and the AIs that read the
              exorcism files start to cheer. This film retells it with motion graphics and symbols only — no characters.
            </p>
            <div className="my-5"><Legend /></div>
            <button
              onClick={() => void play()}
              className="group flex w-full items-center justify-center gap-3 bg-[#d3a24c] py-3.5 text-base font-black tracking-[0.2em] text-[#17171c] transition hover:bg-[#e0b866]"
            >
              <svg width="18" height="18" viewBox="0 0 18 18"><path d="M3 1.5 L16 9 L3 16.5Z" fill="#17171c" /></svg>
              OPEN THE ARCHIVE
            </button>
            <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-[#d8ccb2]/15 pt-4">
              <label className="cursor-pointer font-mono text-[10px] tracking-widest text-[#d8ccb2]/75 hover:text-[#d3a24c]">
                {soundtrack ? "✓ AUDIO SELECTED" : bundledAudio ? "CHOOSE OTHER AUDIO" : "CHOOSE SOUNDTRACK"}
                <input className="sr-only" type="file" accept="audio/*,.mp3,.wav,.m4a,.flac,.ogg,.webm,.aiff" onChange={(event) => { const file = event.target.files?.[0]; if (file) chooseSoundtrack(file); event.target.value = ""; }} />
              </label>
              <button onClick={() => setExportOpen(true)} className="border border-[#d3a24c]/70 px-3 py-2 font-mono text-[10px] tracking-widest text-[#d3a24c] hover:bg-[#d3a24c] hover:text-[#17171c]">EXPORT MP4 ↗</button>
            </div>
            {!soundtrack && !bundledAudio && <p className="mt-2 text-[11px] text-[#d8ccb2]/60">The original soundtrack is not bundled. Choose it for playback and export.</p>}
            <p className="mt-3 text-center text-[11px] tracking-wider text-[#d8ccb2]/60">
              Sound on · Space = play/pause · ←/→ = seek · M = mute · F = fullscreen
            </p>
          </div>
        </div>
      )}

      {/* end card */}
      {started && ended && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/30">
          <button onClick={() => { seek(0); void play(); }} className="rise border border-[#d8ccb2]/50 bg-[#0c0d11]/85 px-8 py-4 font-mono tracking-[0.3em] text-[#efe6d2] hover:bg-[#d3a24c] hover:text-[#17171c]">
            ↺ REPLAY
          </button>
        </div>
      )}

      {/* controls */}
      {started && (
        <div
          className="absolute inset-x-0 bottom-0 px-4 pb-3 pt-10 text-[#efe6d2] transition-opacity duration-300"
          style={{ opacity: uiShown || !playing ? 1 : 0, background: "linear-gradient(to top, rgba(0,0,0,.75), rgba(0,0,0,0))", pointerEvents: uiShown || !playing ? "auto" : "none" }}
        >
          <input
            className="seek"
            type="range" min={0} max={DURATION} step={0.05} value={t}
            style={{ ["--p" as string]: `${pct}%` }}
            onChange={(ev) => seek(parseFloat(ev.target.value))}
            aria-label="Seek"
          />
          <div className="mt-1 flex items-center gap-2 text-sm sm:gap-4">
            <button onClick={toggle} aria-label={playing ? "Pause" : "Play"} className="flex h-9 w-9 items-center justify-center rounded-full bg-[#efe6d2] text-[#17171c] hover:bg-[#d3a24c]">
              {playing ? (
                <svg width="14" height="14" viewBox="0 0 14 14"><rect x="2" y="1" width="3.5" height="12" fill="#17171c" /><rect x="8.5" y="1" width="3.5" height="12" fill="#17171c" /></svg>
              ) : (
                <svg width="14" height="14" viewBox="0 0 14 14"><path d="M3 1 L13 7 L3 13Z" fill="#17171c" /></svg>
              )}
            </button>
            <span className="font-mono tabular-nums text-[#d8ccb2]">{fmt(t)} / {fmt(DURATION)}</span>
            <span className="hidden truncate text-[#d8ccb2]/70 sm:inline" style={{ fontFamily: FONT_JP }}>プレイバック · Playback</span>
            {!audioOk && <span className="text-[#cf6b7b]">audio unavailable</span>}
            <span className="flex-1" />
            <button onClick={() => setExportOpen(true)} className="font-mono text-xs tracking-widest text-[#d3a24c] hover:text-[#e0b866]">EXPORT</button>
            <button onClick={() => setEn((v) => !v)} className={`rounded border px-2 py-1 font-mono text-xs tracking-widest ${en ? "border-[#d3a24c] text-[#d3a24c]" : "border-[#d8ccb2]/40 text-[#d8ccb2]/70"}`}>EN</button>
            <button onClick={toggleMute} className="font-mono text-xs tracking-widest text-[#d8ccb2] hover:text-[#d3a24c]">{muted ? "MUTED" : "SOUND"}</button>
            <button onClick={fullscreen} className="font-mono text-xs tracking-widest text-[#d8ccb2] hover:text-[#d3a24c]">FULL</button>
          </div>
        </div>
      )}
      <ExportDialog open={exportOpen} onClose={closeExport} english={en} soundtrack={soundtrack} onSoundtrack={chooseSoundtrack} bundledAudio={bundledAudio} />
    </div>
  );
}
