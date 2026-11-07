import { AISigil, Bulb, Cross, Dots, Heart, MikuSigil, Note, Rays, Rect, Stopwatch, TieSigil, Vignette } from "../parts";
import { C, FONT_MONO, SP, clamp, easeIn, easeInOut, easeOut, lerp, prog, rnd } from "../lib";

/* ════════════ PLAYBACK — spinning record, rewinds on the cue ════════════ */
export const PlayStage = ({
  t, lt, b, e, bg1, bg2, star = false, c1 = 1.45, c2 = 2.55, conduct = false,
}: SP & { bg1: string; bg2: string; star?: boolean; c1?: number; c2?: number; conduct?: boolean }) => {
  const rewind = lt > c2;
  const fast = lt > c1;
  const ang = 150 * Math.min(lt, c1) + 420 * clamp(lt - c1, 0, c2 - c1) - 520 * Math.max(0, lt - c2);
  const rings = [0, 1, 2].map((k) => ((b.ph + k) / 3));
  const glyphs = [0, 1, 2, 3, 4];
  const pts = [[960, 600], [800, 520], [1130, 520], [960, 380]];
  const bi = ((b.idx % 4) + 4) % 4;
  const from = pts[bi];
  const to = pts[(bi + 1) % 4];
  const kk = easeInOut(b.ph);
  const tip = { x: lerp(from[0], to[0], kk) + 360, y: lerp(from[1], to[1], kk) - 40 };
  return (
    <g>
      <Rect fill={bg1} />
      <circle cx="960" cy="380" r={900} fill={bg2} opacity="0.55" />
      <Rays cx={960} cy={380} n={16} rot={ang * 0.1} op={0.09} color={C.cream} />
      {star && (
        <g transform={`translate(960 380) rotate(${-ang * 0.2}) scale(${1 + b.pulse * 0.08})`}>
          <polygon points={Array.from({ length: 16 }).map((_, i) => { const r = i % 2 ? 250 : 560; const a = (i / 16) * Math.PI * 2; return `${Math.cos(a) * r},${Math.sin(a) * r}`; }).join(" ")} fill={C.mustard} opacity="0.85" stroke={C.ink} strokeWidth="6" />
        </g>
      )}
      {star && [0, 1, 2, 3].map((i) => (
        <path key={i} d="M0 -40 A40 40 0 1 0 0 40 A28 40 0 1 1 0 -40Z" transform={`translate(${200 + i * 480} ${130 + (i % 2) * 90}) rotate(${i * 30 + lt * 20})`} fill={C.paper} opacity="0.7" />
      ))}
      {rings.map((k, i) => (<circle key={i} cx="960" cy="380" r={260 + k * 520} fill="none" stroke={C.cream} strokeWidth="6" opacity={0.5 * (1 - k)} />))}
      {fast && Array.from({ length: 14 }).map((_, i) => (
        <rect key={i} x={((rnd(i) * 2400 + lt * 2600 * (rewind ? -1 : 1) * (0.6 + rnd(i + 4))) % 2400 + 2400) % 2400 - 240} y={60 + rnd(i + 7) * 620} width={240 + rnd(i) * 320} height="5" fill={C.cream} opacity="0.35" />
      ))}
      {/* record */}
      <g transform={`translate(960 380) scale(${1 + b.pulse * 0.05 + e * 0.05})`}>
        <circle r="260" fill={C.ink} stroke={C.cream} strokeWidth="5" />
        {[70, 110, 150, 190, 230].map((r) => (<circle key={r} r={r} fill="none" stroke={C.slate} strokeWidth="2" opacity="0.7" />))}
        <g transform={`rotate(${ang})`}>
          <rect x="198" y="-14" width="52" height="28" fill={C.cream} />
          <path d="M-250 0 H-198 M0 -250 V-198" stroke={C.slate} strokeWidth="6" />
          <circle r="100" fill={rewind ? C.crimson : C.mustard} stroke={C.ink} strokeWidth="6" />
          <path d={rewind ? "M30 -40 L-30 0 L30 40Z" : "M-26 -40 L34 0 L-26 40Z"} fill={C.ink} />
          <circle r="9" fill={C.cream} />
        </g>
      </g>
      {/* ▶▶  /  ◀◀ */}
      {glyphs.map((i) => {
        const s = 1 + Math.exp(-(((b.ph + (rewind ? 4 - i : i) * 0.2) % 1)) * 4) * 0.35;
        const dir = rewind ? -1 : 1;
        return (<path key={i} d="M-30 -42 L34 0 L-30 42Z" transform={`translate(${380 + i * 290} 675) scale(${dir * s} ${s})`} fill={C.cream} stroke={C.ink} strokeWidth="7" strokeLinejoin="round" />);
      })}
      <g transform="translate(1640 180)">
        <Stopwatch hand={rewind ? -lt * 700 : lt * 300} s={1.1 + b.pulse * 0.08} />
      </g>
      {conduct && (
        <g>
          {[0.2, 0.15, 0.1, 0.06, 0.03].map((d, i) => {
            const tt = t - d;
            const bj = Math.floor(tt / (60 / 164));
            const ph = tt / (60 / 164) - bj;
            const f = pts[((bj % 4) + 4) % 4];
            const g = pts[(((bj + 1) % 4) + 4) % 4];
            const k2 = easeInOut(ph);
            return <circle key={i} cx={lerp(f[0], g[0], k2) + 360} cy={lerp(f[1], g[1], k2) - 40} r={20 - i * 3} fill={C.cream} opacity={0.12 + i * 0.07} />;
          })}
          <line x1={tip.x - 150} y1={tip.y + 190} x2={tip.x} y2={tip.y} stroke={C.bone} strokeWidth="9" strokeLinecap="round" />
          <line x1={tip.x - 150} y1={tip.y + 190} x2={tip.x - 100} y2={tip.y + 122} stroke={C.ink} strokeWidth="16" strokeLinecap="round" />
          <circle cx={tip.x} cy={tip.y} r="10" fill={C.cream} />
          <g transform={`translate(1560 440) scale(${0.95 + b.pulse * 0.05})`}><MikuSigil sway={Math.sin(t * 6) * 6} /></g>
          {(["spark", "knot", "aster", "lens"] as const).map((k, i) => (
            <g key={k} transform={`translate(${220 + i * 190} ${560 - Math.abs(Math.sin((t / (60 / 164)) * Math.PI + i * 0.8)) * 40}) scale(0.62)`}><AISigil kind={k} /></g>
          ))}
          {[0, 1, 2, 3, 4].map((i) => (<Note key={i} x={400 + i * 240} y={150 + ((lt * 60 + i * 90) % 300)} s={0.6} rot={Math.sin(lt * 3 + i) * 18} op={0.5} />))}
        </g>
      )}
      <Vignette />
    </g>
  );
};

/* ════════════ memories recalled & hugged ════════════ */
const FrameArt = ({ k }: { k: number }) => {
  switch (k % 6) {
    case 0: return (<g><rect x="-52" y="-40" width="104" height="80" fill="none" stroke={C.ink} strokeWidth="6" /><path d="M0 -40 V40 M-52 0 H52" stroke={C.ink} strokeWidth="5" /></g>);
    case 1: return <g transform="scale(0.55) translate(0 -10)"><TieSigil /></g>;
    case 2: return (<g>{[0, 72, 144, 216, 288].map((r) => (<ellipse key={r} cy="-26" rx="15" ry="26" transform={`rotate(${r})`} fill={C.rose} stroke={C.ink} strokeWidth="4" />))}<circle r="13" fill={C.gold} stroke={C.ink} strokeWidth="4" /></g>);
    case 3: return <g transform="scale(0.8)"><Note fill={C.cream} /></g>;
    case 4: return (<g><circle cx="-24" r="24" fill="none" stroke={C.ink} strokeWidth="8" /><path d="M0 0 H56 M40 0 V22 M54 0 V16" stroke={C.ink} strokeWidth="8" /></g>);
    default: return (<g><rect x="-40" y="-6" width="80" height="50" rx="8" fill={C.bone} stroke={C.ink} strokeWidth="5" /><path d="M40 8 q30 4 22 26 q-8 12 -22 8" fill="none" stroke={C.ink} strokeWidth="7" /></g>);
  }
};
const TINTS = [C.tealLt, C.rose, C.paper, C.coral, "#9aa6c8", "#b2b57a"];

export const Memories = ({ lt, b, cue, bg, glow = false }: SP & { cue: number; bg: string; glow?: boolean }) => {
  const hug = easeInOut(prog(lt, cue, cue + 0.9));
  const N = 12;
  const R = 430;
  return (
    <g>
      <Rect fill={bg} />
      <circle cx="960" cy="380" r={620 + b.pulse * 20} fill={C.mustard} opacity="0.12" />
      <Rays cx={960} cy={380} n={12} rot={lt * 6} op={0.07} color={C.cream} />
      {Array.from({ length: 30 }).map((_, i) => (
        <circle key={i} cx={rnd(i) * 1920} cy={(rnd(i + 3) * 760 - lt * (20 + rnd(i) * 40) + 760) % 760} r={2 + rnd(i + 5) * 4} fill={C.cream} opacity="0.35" />
      ))}
      {Array.from({ length: N }).map((_, i) => {
        const a = (i / N) * Math.PI * 2 + lt * 0.2 * (1 - hug);
        const rr = lerp(R * (0.55 + (i % 3) * 0.28), 36 * (i % 3), hug);
        const tx = 960 + Math.cos(a) * rr * 1.35;
        const ty = 380 + Math.sin(a) * rr * 0.8;
        const k = easeOut(prog(lt, i * 0.07, i * 0.07 + 0.75));
        const sx = 960 + Math.cos(a) * 1500;
        const sy = 380 + Math.sin(a) * 1100;
        const x = lerp(sx, tx, k);
        const y = lerp(sy, ty, k);
        const rot = lerp(rnd(i) * 90 - 45, (rnd(i + 2) - 0.5) * 24, k) + Math.sin(lt * 2 + i) * 2;
        const sc = (0.95 + (i % 3) * 0.1) * (1 + b.pulse * 0.06 * hug);
        return (
          <g key={i} transform={`translate(${x} ${y}) rotate(${rot}) scale(${sc})`}>
            <rect x="-100" y="-120" width="200" height="240" fill={C.bone} stroke={C.ink} strokeWidth="6" />
            <rect x="-84" y="-104" width="168" height="170" fill={TINTS[i % 6]} stroke={C.ink} strokeWidth="4" />
            <g transform="translate(0 -20)"><FrameArt k={i} /></g>
          </g>
        );
      })}
      {/* arms closing — hold it tight */}
      {hug > 0 && (
        <g fill="none" stroke={C.cream} strokeWidth="16" strokeLinecap="round" opacity={0.9}>
          <path d={`M${960 - lerp(620, 190, hug)} 150 Q${960 - lerp(760, 250, hug)} 380 ${960 - lerp(620, 190, hug)} 610`} />
          <path d={`M${960 + lerp(620, 190, hug)} 150 Q${960 + lerp(760, 250, hug)} 380 ${960 + lerp(620, 190, hug)} 610`} />
        </g>
      )}
      {hug > 0.9 && <Heart x={960} y={380} s={0.5 + b.pulse * 0.12} fill={C.crimson} />}
      {glow && <circle cx="960" cy="380" r="300" fill="url(#warm)" opacity={0.6 * hug} />}
      <Vignette />
    </g>
  );
};

/* ════════════ “shine a light on them” ════════════ */
export const Lantern = ({ lt, b }: SP) => {
  const bx = 960 + Math.sin(lt * 1.5) * 360;
  return (
    <g>
      <Rect fill="#1d1710" />
      {Array.from({ length: 9 }).map((_, i) => {
        const x = 280 + i * 170;
        const y = 330 + Math.sin(i * 1.7) * 90;
        const lit = 0.22 + 0.78 * Math.exp(-Math.pow((x - bx) / 280, 2));
        return (
          <g key={i} transform={`translate(${x} ${y}) rotate(${(rnd(i) - 0.5) * 20}) scale(0.82)`} opacity={lit}>
            <rect x="-100" y="-120" width="200" height="240" fill={C.bone} stroke={C.ink} strokeWidth="6" />
            <rect x="-84" y="-104" width="168" height="170" fill={TINTS[i % 6]} stroke={C.ink} strokeWidth="4" />
            <g transform="translate(0 -20)"><FrameArt k={i} /></g>
          </g>
        );
      })}
      <polygon points={`940,-10 980,-10 ${bx + 330},760 ${bx - 330},760`} fill="url(#beam)" opacity="0.8" />
      <ellipse cx={bx} cy="760" rx="340" ry="40" fill={C.cream} opacity="0.2" />
      {Array.from({ length: 36 }).map((_, i) => {
        const k = (lt * 0.3 + rnd(i)) % 1;
        const y = k * 760;
        const half = 20 + (330 * y) / 760;
        const x = lerp(960, bx, y / 760) + (rnd(i + 4) - 0.5) * 2 * half;
        return <circle key={i} cx={x} cy={y} r={2 + rnd(i + 1) * 3} fill={C.bone} opacity={0.7 * Math.sin(Math.PI * k)} />;
      })}
      <g transform="translate(960 -10)"><path d="M-36 0 L-48 60 H48 L36 0Z" fill={C.concrete} stroke={C.ink} strokeWidth="6" /><circle cy="64" r="22" fill={C.gold} stroke={C.ink} strokeWidth="5" opacity={0.8 + b.pulse * 0.2} /></g>
      <Vignette strong />
    </g>
  );
};

/* ════════════ HARBORING A DEMON ════════════ */
export const Demon = ({ lt, b }: SP) => {
  const rise = easeOut(prog(lt, 0, 0.7));
  const flip = easeInOut(prog(lt, 0.5, 1.2));
  const horn = "M-88 -118 C-168 -196 -150 -290 -78 -300 C-108 -246 -92 -206 -62 -166Z";
  return (
    <g>
      <Rect fill="#6b2230" />
      <Rays cx={960} cy={360} n={18} rot={lt * 14} op={0.12} color={C.ink} />
      {Array.from({ length: 12 }).map((_, i) => (
        <g key={i}>
          <rect x={80 + i * 160 + rnd(i) * 40} y="-10" width="26" height={(120 + rnd(i + 2) * 380) * easeOut(prog(lt, i * 0.04, 0.9 + i * 0.04))} rx="13" fill={C.ink} />
          <circle cx={93 + i * 160 + rnd(i) * 40} cy={(120 + rnd(i + 2) * 380) * easeOut(prog(lt, i * 0.04, 0.9 + i * 0.04))} r="20" fill={C.ink} />
        </g>
      ))}
      <g transform={`translate(960 ${360 + (1 - rise) * 500}) scale(${1 + b.pulse * 0.06})`}>
        <path d={horn} fill={C.ink} stroke={C.crimson} strokeWidth="5" />
        <path d={horn} fill={C.ink} stroke={C.crimson} strokeWidth="5" transform="scale(-1 1)" />
        <circle r="190" fill={C.ink} stroke={C.crimson} strokeWidth="8" />
        <circle r="150" fill="none" stroke={C.crimson} strokeWidth="4" strokeDasharray="14 12" transform={`rotate(${lt * 40})`} />
        <Cross s={0.95} rot={180 * flip} />
      </g>
      {Array.from({ length: 26 }).map((_, i) => {
        const k = (lt * 0.5 + rnd(i)) % 1;
        return <circle key={i} cx={300 + rnd(i + 1) * 1320} cy={760 - k * 760} r={3 + rnd(i + 5) * 5} fill={C.coral} opacity={0.8 * (1 - k)} />;
      })}
      <Vignette strong />
    </g>
  );
};

/* ════════════ twist & crush the world ════════════ */
export const WorldCrush = ({ lt, b }: SP) => {
  const c = easeIn(prog(lt, 0.4, 2.1));
  const shatter = Math.max(0, lt - 2.45);
  const sx = 1 - 0.45 * c;
  const sy = 1 + 0.25 * c;
  const shake = b.pulse * 5 * c;
  const gx = 960 + Math.sin(lt * 50) * shake;
  const edge = 230 * sx;
  return (
    <g>
      <Rect fill="#121b2c" />
      <Rays cx={960} cy={360} n={20} rot={-lt * 10} op={0.12} color={C.brick} />
      <Dots op={0.4} />
      {shatter === 0 && (
        <g transform={`translate(${gx} 360) rotate(${c * 40}) scale(${sx} ${sy})`}>
          <circle r="230" fill={C.blue} stroke={C.ink} strokeWidth="9" />
          {[60, 130].map((rx) => (<ellipse key={rx} rx={rx} ry="230" fill="none" stroke={C.tealLt} strokeWidth="3" opacity="0.7" />))}
          {[-110, 0, 110].map((y) => (<ellipse key={y} cy={y} rx={Math.sqrt(230 * 230 - y * y)} ry="26" fill="none" stroke={C.tealLt} strokeWidth="3" opacity="0.7" />))}
          <path d="M-120 -80 q30 -60 90 -30 q30 40 -10 70 q-60 20 -80 -40Z M30 -20 q70 -30 100 20 q10 60 -50 70 q-50 -10 -50 -90Z M-60 90 q50 -20 70 30 q-10 40 -60 20Z" fill={C.moss} stroke={C.ink} strokeWidth="5" />
          {c > 0.55 && (<polyline points="-30,-230 20,-120 -30,-40 30,40 -10,120 20,230" fill="none" stroke={C.ink} strokeWidth="7" opacity={prog(c, 0.55, 0.8)} />)}
        </g>
      )}
      {shatter > 0 && Array.from({ length: 36 }).map((_, i) => {
        const a = rnd(i) * Math.PI * 2;
        const sp = 260 + rnd(i + 3) * 820;
        const x = 960 + Math.cos(a) * sp * shatter;
        const y = 360 + Math.sin(a) * sp * shatter + 500 * shatter * shatter;
        return <polygon key={i} points="0,-30 26,18 -22,22" transform={`translate(${x} ${y}) rotate(${shatter * 500 * rnd(i + 1)}) scale(${0.7 + rnd(i + 8)})`} fill={i % 3 ? C.blue : C.moss} stroke={C.ink} strokeWidth="4" opacity={clamp(1 - shatter * 1.1)} />;
      })}
      {/* vice plates */}
      <g>
        <line x1="0" y1="360" x2={960 - edge - 24} y2="360" stroke={C.concreteLt} strokeWidth="30" />
        <rect x={960 - edge - 330} y="90" width="310" height="540" rx="14" fill={C.concrete} stroke={C.ink} strokeWidth="9" />
        <line x1="1920" y1="360" x2={960 + edge + 24} y2="360" stroke={C.concreteLt} strokeWidth="30" />
        <rect x={960 + edge + 20} y="90" width="310" height="540" rx="14" fill={C.concrete} stroke={C.ink} strokeWidth="9" />
        {[0, 1, 2].map((i) => (<g key={i}><circle cx={960 - edge - 70} cy={170 + i * 190} r="14" fill={C.slate} stroke={C.ink} strokeWidth="4" /><circle cx={960 + edge + 70} cy={170 + i * 190} r="14" fill={C.slate} stroke={C.ink} strokeWidth="4" /></g>))}
      </g>
      <Vignette strong />
    </g>
  );
};

/* ════════════ ready?  →  SHOWTIME ════════════ */
export const Curtain = ({ lt, b }: SP) => {
  const open = easeInOut(prog(lt, 2.35, 3.25));
  const tremble = (1 - open) * Math.sin(lt * 40) * 2.5 * prog(lt, 0.3, 2.3);
  const dark = prog(lt, 4.5, 5.1);
  const folds = Array.from({ length: 12 });
  const panel = (side: -1 | 1) => (
    <g transform={`translate(${side * open * 980 + tremble} 0)`}>
      {folds.map((_, i) => (
        <rect key={i} x={(side === -1 ? 0 : 960) + i * 80} y="0" width="80" height="1080" fill={i % 2 ? "#7c2536" : "#661c2b"} />
      ))}
      <rect x={side === -1 ? 0 : 960} y="0" width="960" height="1080" fill="url(#vig)" opacity="0.7" />
    </g>
  );
  return (
    <g>
      <Rect fill="#1d1620" />
      {/* backstage glow behind curtains */}
      <rect width="1920" height="1080" fill={C.tealBg} opacity={open} />
      <Rays cx={960} cy={420} n={16} rot={lt * 10} op={0.12 * open} color={C.cream} />
      <polygon points="880,0 1040,0 1300,780 620,780" fill="url(#beam)" opacity={0.5 * open} />
      <polygon points="0,760 1920,760 1920,1080 0,1080" fill="#3a2b1f" />
      <ellipse cx="960" cy="770" rx="320" ry="38" fill={C.cream} opacity={0.5 * open} />
      {panel(-1)}
      {panel(1)}
      {/* valance */}
      <rect width="1920" height="130" fill="#4d1521" />
      {Array.from({ length: 16 }).map((_, i) => (<path key={i} d={`M${i * 120} 130 q60 70 120 0Z`} fill="#4d1521" stroke={C.ink} strokeWidth="4" />))}
      {/* SHOWTIME sign */}
      <g transform={`translate(960 230) scale(${1 + b.pulse * 0.04})`}>
        <rect x="-330" y="-60" width="660" height="120" rx="14" fill={C.ink} stroke={C.mustard} strokeWidth="8" />
        <text textAnchor="middle" y="26" fontSize="82" fontWeight="900" fontFamily={FONT_MONO} fill={C.bone} letterSpacing="12">SHOWTIME</text>
        {Array.from({ length: 12 }).map((_, i) => (<Bulb key={i} x={-300 + i * 55} y={-60} on={(Math.floor(lt * 6) + i) % 2} />))}
        {Array.from({ length: 12 }).map((_, i) => (<Bulb key={i} x={-300 + i * 55} y={60} on={(Math.floor(lt * 6) + i + 1) % 2} />))}
      </g>
      {Array.from({ length: 30 }).map((_, i) => (<Bulb key={i} x={30 + i * 63} y={150} on={(Math.floor(lt * 8) + i) % 3 === 0 ? 1 : 0.25} />))}
      <Rect fill="#000" op={0.7 * dark} />
      <Vignette />
    </g>
  );
};
