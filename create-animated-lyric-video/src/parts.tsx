import type { ReactNode } from "react";
import { C, FONT_JP, FONT_MONO } from "./lib";

type P = { x?: number; y?: number; s?: number; rot?: number; op?: number };
const tf = ({ x = 0, y = 0, s = 1, rot = 0 }: P) => `translate(${x} ${y}) rotate(${rot}) scale(${s})`;

/* ───────────── global defs (gradients/patterns) ───────────── */
export const GlobalDefs = () => (
  <defs>
    <radialGradient id="vig" cx="50%" cy="48%" r="75%">
      <stop offset="55%" stopColor="#000" stopOpacity="0" />
      <stop offset="100%" stopColor="#000" stopOpacity="0.62" />
    </radialGradient>
    <radialGradient id="vigStrong" cx="50%" cy="48%" r="62%">
      <stop offset="30%" stopColor="#000" stopOpacity="0" />
      <stop offset="100%" stopColor="#000" stopOpacity="0.9" />
    </radialGradient>
    <radialGradient id="warm" cx="50%" cy="50%" r="50%">
      <stop offset="0%" stopColor="#e4b85c" stopOpacity="0.85" />
      <stop offset="100%" stopColor="#e4b85c" stopOpacity="0" />
    </radialGradient>
    <radialGradient id="soft" cx="50%" cy="50%" r="50%">
      <stop offset="0%" stopColor="#fff" stopOpacity="0.9" />
      <stop offset="100%" stopColor="#fff" stopOpacity="0" />
    </radialGradient>
    <linearGradient id="beam" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stopColor="#f3e3b8" stopOpacity="0.75" />
      <stop offset="100%" stopColor="#f3e3b8" stopOpacity="0.04" />
    </linearGradient>
    <linearGradient id="beamRed" x1="0" y1="0" x2="1" y2="0">
      <stop offset="0%" stopColor="#b8424f" stopOpacity="0.85" />
      <stop offset="100%" stopColor="#b8424f" stopOpacity="0.05" />
    </linearGradient>
    <linearGradient id="scrim" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stopColor="#000" stopOpacity="0" />
      <stop offset="100%" stopColor="#000" stopOpacity="0.72" />
    </linearGradient>
    <pattern id="dots" width="26" height="26" patternUnits="userSpaceOnUse">
      <circle cx="13" cy="13" r="3.4" fill="#000" opacity="0.16" />
    </pattern>
    <pattern id="hatch" width="14" height="14" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
      <rect width="4" height="14" fill="#000" opacity="0.14" />
    </pattern>
    <pattern id="grid" width="60" height="60" patternUnits="userSpaceOnUse">
      <path d="M60 0H0V60" fill="none" stroke="#fff" strokeOpacity="0.12" strokeWidth="2" />
    </pattern>
  </defs>
);

export const Rect = ({ fill, op = 1 }: { fill: string; op?: number }) => (
  <rect width="1920" height="1080" fill={fill} opacity={op} />
);
export const Vignette = ({ strong = false, op = 1 }: { strong?: boolean; op?: number }) => (
  <rect width="1920" height="1080" fill={strong ? "url(#vigStrong)" : "url(#vig)"} opacity={op} />
);
export const Dots = ({ op = 1 }: { op?: number }) => <rect width="1920" height="1080" fill="url(#dots)" opacity={op} />;

export const Rays = ({
  cx = 960, cy = 400, n = 14, rot = 0, color = "#fff", op = 0.1, len = 2400,
}: { cx?: number; cy?: number; n?: number; rot?: number; color?: string; op?: number; len?: number }) => (
  <g transform={`translate(${cx} ${cy}) rotate(${rot})`} opacity={op}>
    {Array.from({ length: n }).map((_, i) => {
      const a0 = (i / n) * Math.PI * 2;
      const a1 = a0 + (Math.PI / n) * 0.9;
      return (
        <path key={i} fill={color}
          d={`M0 0 L${Math.cos(a0) * len} ${Math.sin(a0) * len} L${Math.cos(a1) * len} ${Math.sin(a1) * len}Z`} />
      );
    })}
  </g>
);

/* ───────────── props ───────────── */
export const Cross = ({ fill = C.gold, ...p }: P & { fill?: string }) => (
  <g transform={tf(p)} opacity={p.op ?? 1}>
    <path
      d="M-24 -112 H24 V-50 H72 V-6 H24 V112 H-24 V-6 H-72 V-50 H-24 Z"
      fill={fill} stroke={C.ink} strokeWidth="8" strokeLinejoin="round"
    />
    <path d="M0 -92 V94 M-54 -28 H54" stroke={C.ink} strokeWidth="4" opacity="0.5" fill="none" />
  </g>
);

export const Heart = ({ fill = C.rose, stroke = C.ink, ...p }: P & { fill?: string; stroke?: string }) => (
  <g transform={tf(p)} opacity={p.op ?? 1}>
    <path
      d="M0 46 C-84 -14 -64 -78 -30 -78 C-12 -78 0 -62 0 -52 C0 -62 12 -78 30 -78 C64 -78 84 -14 0 46Z"
      fill={fill} stroke={stroke} strokeWidth="7" strokeLinejoin="round"
    />
  </g>
);

export const Note = ({ fill = C.cream, ...p }: P & { fill?: string }) => (
  <g transform={tf(p)} opacity={p.op ?? 1}>
    <ellipse cx="-14" cy="40" rx="24" ry="17" transform="rotate(-20 -14 40)" fill={fill} stroke={C.ink} strokeWidth="5" />
    <path d="M6 36 V-52 C6 -30 46 -34 44 -2 C36 -26 20 -20 14 -22" fill={fill} stroke={C.ink} strokeWidth="5" strokeLinejoin="round" />
  </g>
);

export const Headphones = ({ stroke = C.ink, fill = C.cream, ...p }: P & { stroke?: string; fill?: string }) => (
  <g transform={tf(p)} opacity={p.op ?? 1}>
    <path d="M-70 20 V-10 A70 70 0 0 1 70 -10 V20" fill="none" stroke={stroke} strokeWidth="14" strokeLinecap="round" />
    <rect x="-90" y="10" width="34" height="62" rx="14" fill={fill} stroke={stroke} strokeWidth="8" />
    <rect x="56" y="10" width="34" height="62" rx="14" fill={fill} stroke={stroke} strokeWidth="8" />
  </g>
);

export const Stopwatch = ({ hand = 0, face = C.cream, ring = C.mustard, ...p }: P & { hand?: number; face?: string; ring?: string }) => (
  <g transform={tf(p)} opacity={p.op ?? 1}>
    <rect x="-9" y="-104" width="18" height="18" fill={ring} stroke={C.ink} strokeWidth="5" />
    <circle r="78" fill={ring} stroke={C.ink} strokeWidth="6" />
    <circle r="60" fill={face} stroke={C.ink} strokeWidth="4" />
    {Array.from({ length: 12 }).map((_, i) => (
      <line key={i} x1="0" y1="-52" x2="0" y2="-44" stroke={C.ink} strokeWidth="3" transform={`rotate(${i * 30})`} />
    ))}
    <line x1="0" y1="0" x2="0" y2="-46" stroke={C.ink} strokeWidth="6" strokeLinecap="round" transform={`rotate(${hand})`} />
    <line x1="0" y1="0" x2="0" y2="-30" stroke={C.ink} strokeWidth="5" strokeLinecap="round" transform={`rotate(${hand / 12})`} />
    <circle r="7" fill={C.ink} />
  </g>
);

export const Padlock = ({ open = 0, body = C.mustardDeep, ...p }: P & { open?: number; body?: string }) => (
  <g transform={tf(p)} opacity={p.op ?? 1}>
    <path
      d={`M-52 -30 V-${70 + open * 26} A52 52 0 0 1 52 -${70 + open * 26} V${-30 + open * 16}`}
      fill="none" stroke={C.concreteLt} strokeWidth="22" strokeLinecap="round"
    />
    <rect x="-100" y="-34" width="200" height="150" rx="14" fill={body} stroke={C.ink} strokeWidth="8" />
    <circle cx="0" cy="26" r="20" fill={C.ink} />
    <rect x="-7" y="30" width="14" height="46" rx="5" fill={C.ink} />
  </g>
);

export const Folder = ({ ...p }: P) => (
  <g transform={tf(p)} opacity={p.op ?? 1}>
    <rect x="-150" y="-100" width="300" height="200" rx="10" fill="#c9a766" stroke={C.ink} strokeWidth="7" />
    <path d="M-150 -100 H-60 L-40 -126 H-150Z" fill="#b8955a" stroke={C.ink} strokeWidth="6" />
    <rect x="-96" y="-30" width="192" height="76" fill={C.bone} stroke={C.ink} strokeWidth="4" />
    <text y="-4" textAnchor="middle" fontSize="19" fontFamily={FONT_MONO} fill={C.ink} fontWeight="700">Exorcism</text>
    <text y="18" textAnchor="middle" fontSize="19" fontFamily={FONT_MONO} fill={C.ink} fontWeight="700">Research</text>
    <text y="40" textAnchor="middle" fontSize="19" fontFamily={FONT_MONO} fill={C.ink} fontWeight="700">Project</text>
  </g>
);

export const Laptop = ({ children, screen = C.tealLt, ...p }: P & { children?: ReactNode; screen?: string }) => (
  <g transform={tf(p)} opacity={p.op ?? 1}>
    <rect x="-330" y="-230" width="660" height="420" rx="22" fill={C.concreteLt} stroke={C.ink} strokeWidth="9" />
    <rect x="-296" y="-198" width="592" height="356" rx="6" fill={screen} stroke={C.ink} strokeWidth="5" />
    {children}
    <path d="M-390 190 H390 L430 244 H-430Z" fill={C.concrete} stroke={C.ink} strokeWidth="9" strokeLinejoin="round" />
    <rect x="-70" y="206" width="140" height="14" rx="7" fill={C.slate} />
  </g>
);

/* ───────────── character-reference symbols (no depicted characters) ───────────── */
/** Hatsune Miku → teal badge, “01”, twin ribbon tails */
export const MikuSigil = ({ sway = 0, ...p }: P & { sway?: number }) => (
  <g transform={tf(p)} opacity={p.op ?? 1}>
    <g transform={`rotate(${sway} -60 -40)`}>
      <path d="M-58 -34 C-150 -20 -176 90 -132 190 C-122 130 -96 84 -52 52Z" fill={C.teal} stroke={C.ink} strokeWidth="7" strokeLinejoin="round" />
    </g>
    <g transform={`rotate(${-sway} 60 -40)`}>
      <path d="M58 -34 C150 -20 176 90 132 190 C122 130 96 84 52 52Z" fill={C.teal} stroke={C.ink} strokeWidth="7" strokeLinejoin="round" />
    </g>
    <circle r="86" fill={C.teal} stroke={C.ink} strokeWidth="8" />
    <circle r="66" fill="none" stroke={C.tealLt} strokeWidth="4" opacity="0.7" />
    <circle cx="-74" cy="-42" r="13" fill={C.ink} />
    <circle cx="74" cy="-42" r="13" fill={C.ink} />
    <text y="22" textAnchor="middle" fontSize="70" fontWeight="900" fontFamily={FONT_JP} fill={C.cream} stroke={C.ink} strokeWidth="2">01</text>
  </g>
);

/** Ui (雨衣) → raindrop with ✕ hairpins */
export const UiSigil = ({ shake = 0, ...p }: P & { shake?: number }) => (
  <g transform={tf(p)} opacity={p.op ?? 1}>
    <g transform={`translate(${shake} 0)`}>
      <path
        d="M0 -112 C54 -40 82 -4 82 40 A82 82 0 0 1 -82 40 C-82 -4 -54 -40 0 -112Z"
        fill="#d4cec2" stroke={C.ink} strokeWidth="8" strokeLinejoin="round"
      />
      <path d="M-34 70 C-10 86 24 84 44 62" fill="none" stroke="#fff" strokeWidth="6" strokeLinecap="round" opacity="0.7" />
      <g stroke={C.mustard} strokeWidth="9" strokeLinecap="round">
        <path d="M-52 -4 l22 22 M-30 -4 l-22 22" />
        <path d="M16 -30 l22 22 M38 -30 l-22 22" />
      </g>
      <text y="62" textAnchor="middle" fontSize="40" fontWeight="900" fontFamily={FONT_JP} fill={C.ink}>雨衣</text>
    </g>
  </g>
);

/** “kareshi-kun” → a blue necktie */
export const TieSigil = ({ wob = 0, ...p }: P & { wob?: number }) => (
  <g transform={tf(p)} opacity={p.op ?? 1}>
    <g transform={`rotate(${wob} 0 -60)`}>
      <path d="M-20 -78 H20 L28 -44 H-28Z" fill={C.navy} stroke={C.ink} strokeWidth="7" strokeLinejoin="round" />
      <path d="M-28 -40 H28 L48 74 L0 118 L-48 74Z" fill={C.navy} stroke={C.ink} strokeWidth="7" strokeLinejoin="round" />
      <path d="M-18 -10 L18 -10 M-26 24 L26 24 M-32 58 L32 58" stroke={C.tealLt} strokeWidth="5" opacity="0.65" />
    </g>
  </g>
);

export type AIKind = "spark" | "knot" | "aster" | "lens";
/** the four generative-AI cheerers, each as an abstract mark */
export const AISigil = ({ kind, ...p }: P & { kind: AIKind }) => {
  const disc =
    kind === "spark" ? "#2c4a7a" : kind === "knot" ? "#486a4e" : kind === "aster" ? "#2a2420" : "#6f6e34";
  return (
    <g transform={tf(p)} opacity={p.op ?? 1}>
      <circle r="76" fill={disc} stroke={C.ink} strokeWidth="8" />
      {kind === "spark" && (
        <path d="M0 -52 C5 -16 16 -5 52 0 C16 5 5 16 0 52 C-5 16 -16 5 -52 0 C-16 -5 -5 -16 0 -52Z" fill="#d8e1f0" stroke={C.ink} strokeWidth="3" />
      )}
      {kind === "knot" && (
        <g fill="none" stroke={C.bone} strokeWidth="9" strokeLinecap="round">
          {[0, 60, 120].map((r) => (<ellipse key={r} rx="46" ry="20" transform={`rotate(${r})`} />))}
        </g>
      )}
      {kind === "aster" && (
        <g stroke={C.coral} strokeWidth="14" strokeLinecap="round">
          {Array.from({ length: 8 }).map((_, i) => (<line key={i} x1="0" y1="-16" x2="0" y2="-52" transform={`rotate(${i * 45})`} />))}
        </g>
      )}
      {kind === "lens" && (
        <g>
          <circle cx="-6" cy="-4" r="30" fill="none" stroke={C.bone} strokeWidth="8" />
          <path d="M20 20 q18 22 6 44" fill="none" stroke={C.bone} strokeWidth="5" />
          <path d="M-30 -22 l10 10 M-20 -22 l-10 10" stroke={C.bone} strokeWidth="4" />
        </g>
      )}
    </g>
  );
};

/* ───────────── vertical caption tag, like the film's story captions ───────────── */
export const VTag = ({ text, x, y, size = 38, color = C.cream, op = 1 }: { text: string; x: number; y: number; size?: number; color?: string; op?: number }) => (
  <g opacity={op}>
    {Array.from(text).map((ch, i) => (
      <text key={i} x={x} y={y + i * (size * 1.08)} fontSize={size} fontWeight="700" fontFamily={FONT_JP} fill={color} textAnchor="middle" stroke={C.ink} strokeWidth="1.2">
        {ch === "ー" ? "丨" : ch}
      </text>
    ))}
  </g>
);

/* ───────────── stylised, low-poly Japan (0..100 box) ───────────── */
export const JAPAN_PARTS: string[] = [
  "62,8 70,2 80,6 90,14 84,22 74,19 67,24 58,17",
  "66,28 72,30 75,42 71,50 66,58 58,63 48,66 36,70 26,75 19,72 28,66 40,60 48,54 56,46 58,36 62,31",
  "33,74 46,73 45,79 34,80",
  "13,77 22,79 26,87 20,95 12,91 9,83",
];
export const Japan = ({
  fill = "none", stroke = C.bone, sw = 1.2, ...p
}: P & { fill?: string; stroke?: string; sw?: number }) => (
  <g transform={tf(p)} opacity={p.op ?? 1}>
    {JAPAN_PARTS.map((pts, i) => (
      <polygon key={i} points={pts} fill={fill} stroke={stroke} strokeWidth={sw} strokeLinejoin="round" />
    ))}
  </g>
);

/* ───────────── marquee bulb ───────────── */
export const Bulb = ({ x, y, on }: { x: number; y: number; on: number }) => (
  <g>
    <circle cx={x} cy={y} r="18" fill={C.cream} opacity={0.25 + 0.75 * on} stroke={C.ink} strokeWidth="3" />
    <circle cx={x} cy={y} r="40" fill="url(#warm)" opacity={0.55 * on} />
  </g>
);

/* ───────────── smoke puff ───────────── */
export const Puff = ({ x, y, r, c = "#5d5d62", op = 1 }: { x: number; y: number; r: number; c?: string; op?: number }) => (
  <circle cx={x} cy={y} r={r} fill={c} opacity={op} stroke={C.ink} strokeWidth="4" />
);
