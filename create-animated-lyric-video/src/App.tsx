import { useCallback, useEffect, useRef, useState } from "react";
import audioSrc from "./assets/playback.mp3";
import { AISigil, GlobalDefs, MikuSigil, TieSigil, UiSigil } from "./parts";
import { LYRICS, lineAt } from "./lyrics";
import { SCENES, SCENE_FADE } from "./timeline";
import { Pulse } from "./scenes/scenesA";
import { C, DURATION, FONT_JP, beatInfo, clamp, easeOutBack, prog } from "./lib";

const fmt = (s: number) => `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, "0")}`;
const wEst = (s: string) => Array.from(s).reduce((a, c) => a + (c.charCodeAt(0) < 256 ? (c === " " ? 0.3 : 0.58) : 1), 0);

/* ───────────── kinetic lyric layer (sits on the 1920×1080 stage) ───────────── */
function Lyrics({ t, en }: { t: number; en: boolean }) {
  const line = lineAt(t);
  const b = beatInfo(t);
  return (
    <>
      <div
        style={{
          position: "absolute", left: 0, right: 0, bottom: 0, height: 420,
          background: "linear-gradient(to top, rgba(8,8,12,.82), rgba(8,8,12,0))",
          opacity: line ? 1 : 0, transition: "opacity .25s",
        }}
      />
      {line && <LyricLine key={line.s} line={line} lt={t - line.s} pulse={b.pulse} en={en} />}
    </>
  );
}

function LyricLine({ line, lt, pulse, en }: { line: (typeof LYRICS)[number]; lt: number; pulse: number; en: boolean }) {
  const chars = Array.from(line.jp);
  const dur = line.e - line.s;
  const fs = Math.max(62, Math.min(line.hot ? 142 : 128, 1720 / wEst(line.jp)));
  const stagger = Math.min(0.055, (dur * 0.5) / chars.length);
  const out = 1 - prog(lt, dur - 0.14, dur + 0.1);
  const sc = 1 + (line.hot ? 0.055 * pulse : 0.015 * pulse);
  const shadow = [[-1, -1], [1, -1], [-1, 1], [1, 1], [0, -1], [0, 1], [-1, 0], [1, 0]]
    .map(([x, y]) => `${x * 5}px ${y * 5}px 0 ${C.ink}`)
    .join(",");
  return (
    <>
      <div
        style={{
          position: "absolute", left: 0, width: 1920, top: 800 - fs * 0.5, textAlign: "center", whiteSpace: "nowrap",
          fontFamily: FONT_JP, fontWeight: 900, fontSize: fs, lineHeight: 1.1, color: C.bone,
          textShadow: `${shadow}, 0 10px 24px rgba(0,0,0,.55)`, opacity: out,
          transform: `scale(${sc})`, transformOrigin: "50% 60%",
        }}
      >
        {chars.map((ch, k) => {
          const p = easeOutBack(prog(lt, k * stagger, k * stagger + 0.24));
          return (
            <span
              key={k}
              style={{
                display: "inline-block", whiteSpace: "pre", opacity: clamp(p * 2.2),
                transform: `translateY(${(1 - p) * 46}px) scale(${0.55 + 0.45 * p}) rotate(${(1 - p) * -9}deg)`,
                color: line.hot && /[A-Za-z!]/.test(ch) ? C.gold : C.bone,
              }}
            >
              {ch}
            </span>
          );
        })}
      </div>
      {en && (
        <div
          style={{
            position: "absolute", left: 0, width: 1920, top: 800 + fs * 0.62, textAlign: "center",
            fontFamily: FONT_JP, fontWeight: 500, fontStyle: "italic", fontSize: 36, color: C.paper,
            textShadow: "0 2px 8px rgba(0,0,0,.9)", opacity: out * prog(lt, 0.2, 0.5) * 0.92, letterSpacing: 1,
          }}
        >
          {line.en}
        </div>
      )}
    </>
  );
}

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

  const st = useRef({ t: 0, playing: false, last: 0, e: 0 });
  const audio = useRef<HTMLAudioElement | null>(null);
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
    const a = new Audio(audioSrc);
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
      if (ev.code === "Space") { ev.preventDefault(); if (started) toggle(); else void play(); }
      else if (ev.key === "ArrowRight") seek(st.current.t + 5);
      else if (ev.key === "ArrowLeft") seek(st.current.t - 5);
      else if (ev.key.toLowerCase() === "m") toggleMute();
      else if (ev.key.toLowerCase() === "f") fullscreen();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [started, toggle, play, seek, toggleMute, fullscreen]);

  const poke = () => { idle.current = performance.now(); setUiShown(true); };
  useEffect(() => {
    if (!playing) return;
    const id = window.setInterval(() => { if (performance.now() - idle.current > 2800) setUiShown(false); }, 500);
    return () => window.clearInterval(id);
  }, [playing]);

  const { t, e } = view;
  const scale = Math.min(dim.w / 1920, dim.h / 1080);
  const b = beatInfo(t);
  const ended = t >= DURATION - 0.01 && !playing;
  const active = SCENES.filter((s) => t >= s.start && t < s.end + SCENE_FADE);
  const cur = SCENES.find((s) => t >= s.start && t < s.end);
  const punch = cur && cur.start > 0 ? 1 + 0.028 * Math.exp(-(t - cur.start) * 13) : 1;
  const pct = (t / DURATION) * 100;

  return (
    <div ref={rootRef} className="relative h-full w-full select-none overflow-hidden bg-black" onMouseMove={poke} onClick={poke}>
      {/* the 1920×1080 stage */}
      <div
        className="absolute overflow-hidden"
        style={{ width: 1920, height: 1080, left: "50%", top: "50%", transform: `translate(-50%,-50%) scale(${scale})`, background: C.night }}
        onClick={() => started && toggle()}
      >
        <svg viewBox="0 0 1920 1080" width="1920" height="1080" style={{ position: "absolute", inset: 0 }}>
          <GlobalDefs />
          <g transform={`translate(960 540) scale(${punch}) translate(-960 -540)`}>
            {started
              ? active.map((s) => {
                  const lt = t - s.start;
                  const op = s.start === 0 ? 1 : prog(t, s.start, s.start + SCENE_FADE);
                  return (
                    <g key={s.id} opacity={op}>
                      {s.r({ t, lt, dur: s.end - s.start, b, e })}
                    </g>
                  );
                })
              : <Pulse t={t} lt={performance.now() / 1000} dur={99} b={b} e={0.2} />}
          </g>
        </svg>
        {started && <Lyrics t={t} en={en} />}
        <div className="grain" style={{ backgroundImage: NOISE() }} />
      </div>

      {/* start screen */}
      {!started && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/55 px-4">
          <div className="rise w-full max-w-[640px] border border-[#d8ccb2]/30 bg-[#0c0d11]/90 p-7 text-[#efe6d2] shadow-2xl backdrop-blur-sm sm:p-9">
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
          <div className="mt-1 flex items-center gap-4 text-sm">
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
            <button onClick={() => setEn((v) => !v)} className={`rounded border px-2 py-1 font-mono text-xs tracking-widest ${en ? "border-[#d3a24c] text-[#d3a24c]" : "border-[#d8ccb2]/40 text-[#d8ccb2]/70"}`}>EN</button>
            <button onClick={toggleMute} className="font-mono text-xs tracking-widest text-[#d8ccb2] hover:text-[#d3a24c]">{muted ? "MUTED" : "SOUND"}</button>
            <button onClick={fullscreen} className="font-mono text-xs tracking-widest text-[#d8ccb2] hover:text-[#d3a24c]">FULL</button>
          </div>
        </div>
      )}
    </div>
  );
}

/* film grain tile, generated once */
let noiseUrl = "";
function NOISE() {
  if (noiseUrl) return noiseUrl;
  const c = document.createElement("canvas");
  c.width = c.height = 160;
  const x = c.getContext("2d")!;
  const d = x.createImageData(160, 160);
  for (let i = 0; i < d.data.length; i += 4) {
    const v = Math.random() * 255;
    d.data[i] = d.data[i + 1] = d.data[i + 2] = v;
    d.data[i + 3] = 255;
  }
  x.putImageData(d, 0, 0);
  noiseUrl = `url(${c.toDataURL()})`;
  return noiseUrl;
}
