import { GlobalDefs } from "./parts";
import { type Line, lineAt } from "./lyrics";
import { SCENES, SCENE_FADE } from "./timeline";
import { Pulse } from "./scenes/scenesA";
import { C, FONT_JP, beatInfo, clamp, easeOutBack, prog } from "./lib";
import type { ProjectSnapshot } from "./project";

const wEst = (s: string) => Array.from(s).reduce((a, c) => a + (c.charCodeAt(0) < 256 ? (c === " " ? 0.3 : 0.58) : 1), 0);

/* ───────────── kinetic lyric layer (sits on the 1920×1080 stage) ───────────── */
function Lyrics({ t, en, lines, rendering }: { t: number; en: boolean; lines: Line[]; rendering: boolean }) {
  const line = lineAt(t, lines);
  const b = beatInfo(t);
  return (
    <>
      <div
        style={{
          position: "absolute", left: 0, right: 0, bottom: 0, height: 420,
          background: "linear-gradient(to top, rgba(8,8,12,.82), rgba(8,8,12,0))",
          opacity: rendering ? lyricOverlayOpacity(t, lines) : line ? 1 : 0,
          transition: rendering ? "none" : "opacity .25s",
        }}
      />
      {line && <LyricLine key={line.s} line={line} lt={t - line.s} pulse={b.pulse} en={en} />}
    </>
  );
}

function LyricLine({ line, lt, pulse, en }: { line: Line; lt: number; pulse: number; en: boolean }) {
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

// CSS's default `ease` curve, evaluated against the timeline rather than wall clock.
function cssEase(x: number) {
  const curve = (u: number, a: number, b: number) => 3 * (1 - u) ** 2 * u * a + 3 * (1 - u) * u ** 2 * b + u ** 3;
  let lo = 0, hi = 1;
  for (let i = 0; i < 16; i++) {
    const mid = (lo + hi) / 2;
    if (curve(mid, 0.25, 0.25) < x) lo = mid; else hi = mid;
  }
  return curve((lo + hi) / 2, 0.1, 1);
}

function lyricOverlayOpacity(t: number, lines: Line[]) {
  // Consecutive lyric lines leave the same gradient visible between them.
  const groups: { start: number; end: number }[] = [];
  for (const line of lines) {
    const last = groups[groups.length - 1];
    if (last && line.s <= last.end + 0.00001) last.end = Math.max(last.end, line.e);
    else groups.push({ start: line.s, end: line.e });
  }
  for (const group of groups) {
    if (t >= group.start && t < group.end) return cssEase(clamp((t - group.start) / 0.25));
    if (t >= group.end && t < group.end + 0.25) return 1 - cssEase(clamp((t - group.end) / 0.25));
  }
  return 0;
}

const sceneById = new Map(SCENES.map((scene) => [scene.id, scene]));

/** The same stage is used by the interactive player and the remote renderer. */
export function FilmStage({ t, e, started, snapshot, width, height, rendering = false, onClick }: {
  t: number; e: number; started: boolean; snapshot: ProjectSnapshot;
  width: number; height: number; rendering?: boolean; onClick?: () => void;
}) {
  const scale = Math.min(width / 1920, height / 1080);
  const b = beatInfo(t);
  const active = snapshot.scenes.filter((s) => t >= s.start && t < s.end + SCENE_FADE);
  const cur = snapshot.scenes.find((s) => t >= s.start && t < s.end);
  const punch = cur && cur.start > 0 ? 1 + 0.028 * Math.exp(-(t - cur.start) * 13) : 1;
  const grainPositions = [[0, 0], [-37, 21], [29, -43], [-19, -27]];
  const grain = grainPositions[Math.floor(((t % 0.6) + 0.6) % 0.6 / 0.15)];

  return (
    <div
      className="absolute overflow-hidden"
      style={{ width: 1920, height: 1080, left: "50%", top: "50%", transform: `translate(-50%,-50%) scale(${scale})`, background: C.night }}
      onClick={onClick}
    >
      <svg viewBox="0 0 1920 1080" width="1920" height="1080" style={{ position: "absolute", inset: 0 }}>
        <GlobalDefs />
        <g transform={`translate(960 540) scale(${punch}) translate(-960 -540)`}>
          {started
            ? active.map((s) => {
                const scene = sceneById.get(s.id);
                if (!scene) throw new Error(`Unknown scene: ${s.id}`);
                const lt = t - s.start;
                const op = s.start === 0 ? 1 : prog(t, s.start, s.start + SCENE_FADE);
                return <g key={s.id} opacity={op}>{scene.r({ t, lt, dur: s.end - s.start, b, e })}</g>;
              })
            : <Pulse t={t} lt={performance.now() / 1000} dur={99} b={b} e={0.2} />}
        </g>
      </svg>
      {started && <Lyrics t={t} en={snapshot.showEnglish} lines={snapshot.lyrics} rendering={rendering} />}
      <div className="grain" style={{ backgroundImage: NOISE(), ...(rendering ? { animation: "none", transform: `translate(${grain[0]}px, ${grain[1]}px)` } : {}) }} />
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
