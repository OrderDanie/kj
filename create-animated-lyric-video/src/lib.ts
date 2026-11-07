// Shared timing / easing / palette helpers for the "Playback" motion-graphics film.

export const BPM = 164;
export const BEAT = 60 / BPM; // seconds per beat (measured from the audio)
export const DURATION = 149.5;

export const clamp = (x: number, a = 0, b = 1) => Math.min(b, Math.max(a, x));
export const lerp = (a: number, b: number, k: number) => a + (b - a) * k;
/** progress of t between a and b, clamped 0..1 */
export const prog = (t: number, a: number, b: number) => clamp((t - a) / (b - a));
export const easeOut = (x: number) => 1 - Math.pow(1 - x, 3);
export const easeIn = (x: number) => x * x * x;
export const easeInOut = (x: number) => (x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2);
export const easeOutBack = (x: number) => {
  const c1 = 1.70158;
  const c3 = c1 + 1;
  return 1 + c3 * Math.pow(x - 1, 3) + c1 * Math.pow(x - 1, 2);
};
export const easeOutElastic = (x: number) => {
  if (x === 0 || x === 1) return x;
  return Math.pow(2, -10 * x) * Math.sin((x * 10 - 0.75) * ((2 * Math.PI) / 3)) + 1;
};
/** deterministic pseudo random 0..1 from an integer-ish seed */
export const rnd = (n: number) => {
  const x = Math.sin(n * 127.1 + 311.7) * 43758.5453;
  return x - Math.floor(x);
};

export type Beat = { idx: number; ph: number; pulse: number; saw: number };
export const beatInfo = (t: number): Beat => {
  const b = t / BEAT;
  const idx = Math.floor(b);
  const ph = b - idx;
  return { idx, ph, pulse: Math.exp(-ph * 6), saw: 1 - ph };
};

export type SP = {
  t: number; // global time (s)
  lt: number; // scene-local time (s)
  dur: number; // scene duration
  b: Beat;
  e: number; // live audio energy 0..1 (low band)
};

// Muted, earthy palette — deliberately NO neon.
export const C = {
  ink: "#17171c",
  night: "#0c0d11",
  slate: "#5b5c64",
  concrete: "#74757c",
  concreteLt: "#9a9ba1",
  cream: "#efe6d2",
  bone: "#f5efe1",
  paper: "#d8ccb2",
  teal: "#3b8e8a",
  tealDeep: "#1f5a5e",
  tealLt: "#86bfb6",
  tealBg: "#2a7c78",
  mustard: "#c49a3c",
  mustardDeep: "#9a7a2c",
  gold: "#d3a24c",
  brick: "#8d2f3b",
  crimson: "#a23a4c",
  wine: "#5e1f2c",
  navy: "#20395f",
  blue: "#2b6b8e",
  blueDeep: "#183a58",
  indigo: "#4b4f93",
  rose: "#c88a92",
  olive: "#85843c",
  moss: "#4a6a48",
  rust: "#8a4b2a",
  coral: "#d28a62",
  brown: "#2a211c",
};

export const FONT_JP =
  '"Noto Sans JP Variable","Noto Sans JP","Hiragino Kaku Gothic ProN","Hiragino Sans","Yu Gothic","YuGothic","Meiryo","Noto Sans CJK JP","Segoe UI",system-ui,sans-serif';
export const FONT_MONO = '"SF Mono","Cascadia Mono","Consolas","Noto Sans Mono","Noto Sans JP Variable","Noto Sans JP",monospace';

/** typewriter helper */
export const typed = (s: string, t: number, start: number, cps = 24) =>
  s.slice(0, Math.max(0, Math.min(s.length, Math.floor((t - start) * cps))));

/** pendulum-like beat swing  (-1..1) */
export const swing = (t: number, div = 1) => Math.sin((t / BEAT) * Math.PI * div);
