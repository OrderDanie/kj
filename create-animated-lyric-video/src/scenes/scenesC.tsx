import { AISigil, Dots, Folder, Heart, Japan, Laptop, MikuSigil, Padlock, Puff, Rays, Rect, Stopwatch, UiSigil, VTag, Vignette } from "../parts";
import { C, FONT_JP, FONT_MONO, SP, clamp, easeInOut, easeOut, easeOutBack, lerp, prog, rnd } from "../lib";

/* ════════════ “Classical + Singing → Time travel → breaks modern technology” ════════════ */
const Circle = ({ x, y, r, fill, k, label, lc = C.ink, children }: { x: number; y: number; r: number; fill: string; k: number; label: string; lc?: string; children: React.ReactNode }) => {
  const s = easeOutBack(k);
  return (
    <g transform={`translate(${x} ${y}) scale(${Math.max(0.001, s)})`} opacity={clamp(k * 3)}>
      <circle r={r} fill={fill} stroke={C.ink} strokeWidth="8" />
      {children}
      <text y={r + 44} textAnchor="middle" fontSize="32" fontWeight="900" fontFamily={FONT_MONO} fill={lc} stroke={lc === C.ink ? "none" : C.ink} strokeWidth="7" paintOrder="stroke">{label}</text>
    </g>
  );
};
const Arrow = ({ x1, y1, x2, y2, k, color = C.ink }: { x1: number; y1: number; x2: number; y2: number; k: number; color?: string }) => {
  const x = lerp(x1, x2, k), y = lerp(y1, y2, k);
  const a = Math.atan2(y2 - y1, x2 - x1);
  return (
    <g opacity={clamp(k * 4)}>
      <line x1={x1} y1={y1} x2={x} y2={y} stroke={color} strokeWidth="14" strokeLinecap="round" />
      <polygon points="0,-24 44,0 0,24" transform={`translate(${x} ${y}) rotate(${(a * 180) / Math.PI})`} fill={color} />
    </g>
  );
};

export const Diagram = ({ t, lt, b, e }: SP) => {
  const k = (a: number) => prog(lt, a, a + 0.55);
  const tick = Math.sin((t / (60 / 164)) * Math.PI);
  const xk = prog(lt, 6.2, 6.7);
  const heart = prog(lt, 7.1, 7.7);
  const gauge = lerp(0.85, 0.16, easeInOut(prog(lt, 4.9, 8.0)));
  return (
    <g>
      <Rect fill={C.tealBg} />
      <rect width="1920" height="1080" fill="url(#grid)" opacity="0.7" />
      <Dots op={0.5} />
      <Circle x={290} y={200} r={104} fill={C.mustard} k={k(0.5)} label="Classical">
        <rect x="-60" y="-70" width="86" height="116" fill={C.bone} stroke={C.ink} strokeWidth="5" transform="rotate(-8)" />
        {[-44, -26, -8, 10].map((y) => (<line key={y} x1="-48" y1={y} x2="14" y2={y} stroke={C.ink} strokeWidth="3" transform="rotate(-8)" />))}
        <path d="M0 40 L70 -4 L84 -28 Q100 -44 92 -6 L74 22 L10 60Z" fill={C.gold} stroke={C.ink} strokeWidth="5" strokeLinejoin="round" />
      </Circle>
      <g opacity={k(1.5)} transform={`translate(490 200) scale(${1 + b.pulse * 0.1})`}>
        <path d="M-8 -50 H8 V-8 H50 V8 H8 V50 H-8 V8 H-50 V-8 H-8Z" fill={C.ink} />
      </g>
      <Circle x={690} y={200} r={104} fill={C.indigo} k={k(2.0)} label="Singing">
        <ellipse rx="70" ry={34 + Math.abs(Math.sin(lt * 7)) * 30 * (0.4 + e)} fill={C.ink} stroke={C.crimson} strokeWidth="12" />
        <ellipse cy="14" rx="36" ry="12" fill={C.crimson} opacity="0.8" />
      </Circle>
      <Arrow x1={520} y1={330} x2={440} y2={375} k={k(3.0)} color={C.blueDeep} />
      <Circle x={390} y={470} r={96} fill="#4d8a3c" k={k(3.3)} label="Time travel">
        <g transform="scale(1.05)"><Stopwatch hand={-lt * 300} ring={C.mustard} /></g>
      </Circle>
      <Arrow x1={500} y1={470} x2={780} y2={470} k={k(4.9)} />
      <Circle x={920} y={470} r={96} fill="#68696f" k={k(5.2)} label="Modern technology" lc="#f3c3b8">
        <rect x="-60" y="-52" width="86" height="64" rx="5" fill={C.bone} stroke={C.ink} strokeWidth="5" transform="rotate(-8)" />
        <rect x="-8" y="-26" width="56" height="78" rx="8" fill={C.concreteLt} stroke={C.ink} strokeWidth="5" transform="rotate(10)" />
        {[0, 1, 2, 3].map((i) => (<path key={i} d={`M${-84 + i * 56} -80 l8 -14 l8 14`} stroke={C.bone} strokeWidth="4" fill="none" opacity={0.6 + 0.4 * Math.sin(lt * 20 + i)} />))}
      </Circle>
      {xk > 0 && (
        <g stroke={C.crimson} strokeWidth="22" strokeLinecap="round" opacity={xk}>
          <line x1={850} y1={400} x2={lerp(850, 990, easeOut(xk))} y2={lerp(400, 540, easeOut(xk))} />
          <line x1={990} y1={400} x2={lerp(990, 850, easeOut(xk))} y2={lerp(400, 540, easeOut(xk))} />
        </g>
      )}
      {/* metronome — one-two, one-two */}
      <g transform="translate(1790 100) scale(0.8)">
        <path d="M-60 140 L-34 -70 H34 L60 140Z" fill={C.bone} stroke={C.ink} strokeWidth="7" strokeLinejoin="round" />
        <line x1="0" y1="110" x2="0" y2="-90" stroke={C.ink} strokeWidth="7" strokeLinecap="round" transform={`rotate(${tick * 26} 0 110)`} />
        <rect x="-14" y="-20" width="28" height="22" fill={C.mustard} stroke={C.ink} strokeWidth="4" transform={`rotate(${tick * 26} 0 110)`} />
        <text x="0" y="200" textAnchor="middle" fontSize="40" fontWeight="900" fontFamily={FONT_JP} fill={C.bone} stroke={C.ink} strokeWidth="1">{b.idx % 2 ? "ツー" : "ワン"}</text>
      </g>
      {/* pure white heart + shallow breath */}
      <g opacity={heart} transform={`translate(1490 380) scale(0.95)`}>
        <circle r="210" fill={C.tealDeep} opacity="0.55" />
        <Heart x={0} y={-10} s={2.1 + b.pulse * 0.16} fill={C.bone} />
        <rect x="-190" y="170" width="380" height="26" rx="13" fill={C.ink} opacity="0.7" />
        <rect x="-186" y="174" width={372 * gauge} height="18" rx="9" fill={C.tealLt} />
        <text x="0" y="236" textAnchor="middle" fontSize="26" fontFamily={FONT_MONO} fill={C.bone}>BREATH ▾ shallow</text>
      </g>
      <Vignette />
    </g>
  );
};

/* ════════════ “A target is something you shoot down” ════════════ */
export const Target = ({ lt, b }: SP) => {
  const lock = easeOut(prog(lt, 0.2, 2.5));
  const r = lerp(430, 150, lock);
  return (
    <g>
      <Rect fill="#15233a" />
      <Dots op={0.4} />
      <rect y="700" width="1920" height="380" fill="#0f1a2c" />
      <polygon points="720,0 1200,0 1500,700 420,700" fill="url(#beam)" opacity="0.1" />
      <g transform="translate(960 380) scale(1.02)">
        <Laptop screen="#7e2f40">
          <clipPath id="scr"><rect x="-296" y="-198" width="592" height="356" /></clipPath>
          <g clipPath="url(#scr)" transform="translate(0 -20)">
            <Rays n={22} rot={lt * 30} color={C.coral} op={0.2} len={700} />
            {[40, 80, 120].map((rr) => (<circle key={rr} r={rr} fill="none" stroke={C.bone} strokeWidth="6" opacity="0.8" />))}
            <circle r="16" fill={C.bone} />
            <rect x="-296" y="-198" width="592" height="356" fill={C.brick} opacity={0.18 * b.pulse} />
          </g>
        </Laptop>
      </g>
      {/* lock-on reticle */}
      <g transform="translate(960 360)">
        <g transform={`rotate(${lt * 40})`}>
          <circle r={r} fill="none" stroke={C.cream} strokeWidth="6" strokeDasharray="60 28" />
          {[0, 90, 180, 270].map((a) => (<line key={a} x1={r - 24} y1="0" x2={r + 46} y2="0" stroke={C.cream} strokeWidth="9" transform={`rotate(${a})`} />))}
        </g>
        <circle r={r * 0.62} fill="none" stroke={C.crimson} strokeWidth="5" opacity={lock} />
        {[[-1, -1], [1, -1], [-1, 1], [1, 1]].map(([sx, sy], i) => (
          <path key={i} d="M0 0 H60 M0 0 V60" transform={`translate(${sx * (r + 70)} ${sy * (r * 0.8 + 50)}) scale(${-sx} ${-sy})`} stroke={C.cream} strokeWidth="9" fill="none" />
        ))}
        <text x={-790} y={-250} fontSize="44" fontWeight="900" fontFamily={FONT_MONO} fill={lock > 0.9 ? "#e08a94" : C.cream} letterSpacing="8" opacity={0.6 + b.pulse * 0.4}>
          {lock > 0.9 ? "LOCKED" : "TRACKING"}
        </text>
      </g>
      <VTag text="「逆境ベートーヴェン」" x={1620} y={110} size={40} />
      <Vignette strong />
    </g>
  );
};

/* ════════════ security lockdown → dossier breaks free ════════════ */
export const Lock = ({ lt, b }: SP) => {
  const frame = Math.floor(lt * 14);
  const bolt = (seed: number, x0: number, y0: number) => {
    const pts: string[] = [`${x0},${y0}`];
    for (let i = 1; i <= 6; i++) {
      const k = i / 6;
      pts.push(`${lerp(x0, 960, k) + (rnd(seed + i + frame) - 0.5) * 90 * (1 - k)},${lerp(y0, 330, k) + (rnd(seed * 3 + i + frame) - 0.5) * 90 * (1 - k)}`);
    }
    return pts.join(" ");
  };
  const brk = easeOut(prog(lt, 0.7, 1.15));
  return (
    <g>
      <Rect fill="#26273b" />
      <Dots op={0.5} />
      <Rays cx={960} cy={330} n={14} rot={lt * 20} color={C.concreteLt} op={0.1} />
      {lt < 1.0 &&
        [[200, 90], [1700, 120], [260, 620], [1650, 640]].map(([x, y], i) => (
          <polyline key={i} points={bolt(i * 11, x, y)} fill="none" stroke={C.concreteLt} strokeWidth="10" strokeLinejoin="round" opacity={0.5 + 0.5 * ((frame + i) % 2)} />
        ))}
      <g transform={`translate(${(Math.sin(lt * 90) * 6) * (lt < 1 ? 1 : 0)} 0)`} opacity={1 - brk}>
        <Padlock x={960} y={330} s={2.1 + b.pulse * 0.05} open={prog(lt, 0.6, 1)} />
      </g>
      {brk > 0 && (
        <g>
          {[0, 1, 2, 3, 4, 5].map((i) => (<Puff key={i} x={960 + (i - 2.5) * 110 * brk} y={330 + Math.sin(i * 2) * 60 * brk} r={50 + i * 8 + brk * 60} op={0.8 * (1 - brk * 0.5)} c="#6a6a70" />))}
          <Folder x={960} y={330 - 150 * brk} s={1.7 + brk * 0.4} rot={lerp(0, -14, brk) + Math.sin(lt * 10) * 3} />
          <g opacity={prog(lt, 1.0, 1.6)}>
            <path d="M780 330 l-60 -30 M1140 330 l60 -30" stroke={C.bone} strokeWidth="8" />
          </g>
        </g>
      )}
      <VTag text="機密管理システム【異常発生】" x={1620} y={80} size={34} />
      <Vignette strong />
    </g>
  );
};

/* ════════════ the anomaly spreads across the country ════════════ */
const TARGETS = [[72, 8], [82, 14], [86, 18], [69, 34], [72, 44], [54, 50], [46, 62], [34, 71], [40, 76], [18, 80], [16, 88], [26, 74], [62, 24], [50, 56]];
export const JapanLeak = ({ lt, b }: SP) => {
  const ox = 600, oy = 20, s = 7;
  const P = (x: number, y: number) => ({ x: ox + x * s, y: oy + y * s });
  const o = P(62, 52);
  return (
    <g>
      <Rect fill={C.night} />
      <rect width="1920" height="1080" fill="url(#grid)" opacity="0.5" />
      <Japan x={ox} y={oy} s={s} stroke={C.bone} sw={1.1} fill="#1a1b22" />
      {TARGETS.map(([x, y], i) => {
        const k = easeOut(prog(lt, 0.15 + i * 0.1, 0.8 + i * 0.1));
        const p = P(x, y);
        return (
          <g key={i}>
            <line x1={o.x} y1={o.y} x2={lerp(o.x, p.x, k)} y2={lerp(o.y, p.y, k)} stroke={C.crimson} strokeWidth="5" strokeLinecap="round" />
            {k > 0.95 && <circle cx={p.x} cy={p.y} r={10 + Math.exp(-((lt * 2 + i * 0.3) % 1) * 4) * 22} fill={C.crimson} stroke={C.ink} strokeWidth="3" />}
          </g>
        );
      })}
      <circle cx={o.x} cy={o.y} r={22 + b.pulse * 16} fill={C.crimson} stroke={C.bone} strokeWidth="4" />
      <circle cx={o.x} cy={o.y} r={(lt * 220) % 260} fill="none" stroke={C.crimson} strokeWidth="4" opacity="0.6" />
      <VTag text="機密管理システム【異常発生】" x={1620} y={80} size={34} />
      <Vignette strong />
    </g>
  );
};

/* ════════════ “draw a cross” ════════════ */
export const LaptopCross = ({ lt, b }: SP) => {
  const v = prog(lt, 0.25, 0.85);
  const h = prog(lt, 0.85, 1.3);
  const done = prog(lt, 1.3, 1.5);
  const pulse = done * (1 + b.pulse * 0.06);
  return (
    <g>
      <Rect fill="#1f3452" />
      <Dots op={0.4} />
      <Rect fill="#000" op={0.2} />
      <g transform="translate(960 400) scale(0.95)">
        <Laptop screen="#6b3a58">
          <g transform="translate(0 -20)">
            <Rays n={16} rot={lt * 24} color={C.rose} op={0.22} len={600} />
            {[
              { k: "spark" as const, x: -200, y: 40 }, { k: "knot" as const, x: -70, y: 40 },
              { k: "aster" as const, x: 70, y: 40 }, { k: "lens" as const, x: 200, y: 40 },
            ].map((a, i) => (
              <g key={a.k} transform={`translate(${a.x} ${a.y + Math.sin(lt * 6 + i) * 6}) scale(${0.42 * easeOutBack(prog(lt, 0.2 + i * 0.12, 0.6 + i * 0.12))})`}><AISigil kind={a.k} /></g>
            ))}
            <g transform="translate(-80 -80) scale(0.34)"><UiSigil /></g>
            <g transform="translate(90 -78) scale(0.3)"><MikuSigil /></g>
          </g>
        </Laptop>
      </g>
      <g fill="none" strokeLinecap="round" opacity="0.98" transform={`translate(960 340) scale(${pulse > 0 ? pulse : 1}) translate(-960 -340)`}>
        <line x1="960" y1="40" x2="960" y2={lerp(40, 640, v)} stroke={C.ink} strokeWidth="58" />
        <line x1="700" y1="250" x2={lerp(700, 1220, h)} y2="250" stroke={C.ink} strokeWidth="58" />
        <line x1="960" y1="40" x2="960" y2={lerp(40, 640, v)} stroke={C.gold} strokeWidth="38" />
        <line x1="700" y1="250" x2={lerp(700, 1220, h)} y2="250" stroke={C.gold} strokeWidth="38" />
      </g>
      <Rect fill={C.bone} op={0.35 * Math.exp(-Math.max(0, lt - 1.3) * 8) * (lt > 1.3 ? 1 : 0)} />
      <VTag text="「アクマバライ」" x={260} y={100} size={42} />
      <Vignette strong />
    </g>
  );
};

/* ════════════ nationwide generative AIs go haywire ════════════ */
export const AIGlitch = ({ lt, b }: SP) => {
  const phase2 = lt > 0.95;
  const frame = Math.floor(lt * 16);
  const shift = (1 - prog(lt, 0, 0.95)) * 0 + (phase2 ? 0 : 7);
  const bolt = (seed: number, x0: number, y0: number) => {
    const pts: string[] = [`${x0},${y0}`];
    for (let i = 1; i <= 5; i++) {
      const k = i / 5;
      pts.push(`${lerp(x0, 960, k * 0.9) + (rnd(seed + i + frame) - 0.5) * 80},${lerp(y0, 340, k * 0.9) + (rnd(seed * 3 + i + frame) - 0.5) * 80}`);
    }
    return pts.join(" ");
  };
  return (
    <g>
      <Rect fill={phase2 ? "#8b2d39" : "#8a8b92"} />
      {phase2 ? <Rays cx={960} cy={340} n={20} rot={lt * 30} color={C.ink} op={0.2} /> : <Dots op={0.6} />}
      {!phase2 && [[240, 100], [1700, 100], [200, 620], [1720, 620], [960, 20]].map(([x, y], i) => (
        <polyline key={i} points={bolt(i * 7, x, y)} fill="none" stroke={C.bone} strokeWidth="9" strokeLinejoin="round" opacity={(frame + i) % 3 ? 0.85 : 0.2} />
      ))}
      <g transform={`translate(960 340) scale(${phase2 ? 2.0 + b.pulse * 0.15 : 1.9})`}>
        <g transform={`translate(${-shift} 0)`} opacity="0.5"><AISigil kind="spark" /></g>
        <g transform={`translate(${shift} 0)`} opacity="0.5"><circle r="76" fill={C.rose} /></g>
        <AISigil kind="spark" />
      </g>
      {phase2 && (
        <g>
          <g transform={`translate(330 340) rotate(${-10 + Math.sin(lt * 8) * 8}) scale(${easeOutBack(prog(lt, 1.0, 1.4))})`}>
            <rect x="-70" y="-70" width="140" height="140" rx="10" fill={C.ink} stroke={C.bone} strokeWidth="6" />
            <rect x="-40" y="-70" width="80" height="50" fill={C.bone} /><rect x="-26" y="-60" width="24" height="32" fill={C.ink} />
            <rect x="-44" y="10" width="88" height="46" fill={C.concreteLt} />
          </g>
          <g transform={`translate(1590 360) rotate(${12 + Math.sin(lt * 7) * 8}) scale(${easeOutBack(prog(lt, 1.15, 1.55))})`}>
            <polygon points="0,-90 78,-45 78,45 0,90 -78,45 -78,-45" fill={C.bone} stroke={C.ink} strokeWidth="7" />
            <circle r="34" fill="#4a7a5a" stroke={C.ink} strokeWidth="6" />
            <circle r="12" fill={C.ink} />
          </g>
        </g>
      )}
      <VTag text="全国の生成AI【異常発生】" x={1760} y={70} size={34} color={phase2 ? C.bone : C.ink} />
      <Vignette />
    </g>
  );
};

/* ════════════ cheering squad: Ui Devil / Miku Devil ════════════ */
const Fan = ({ x, y, text, tilt, bg }: { x: number; y: number; text: string; tilt: number; bg: string }) => (
  <g transform={`translate(${x} ${y}) rotate(${tilt})`}>
    <rect x="-7" y="30" width="14" height="150" rx="6" fill="#a98a56" stroke={C.ink} strokeWidth="5" />
    <circle r="82" fill={bg} stroke={C.ink} strokeWidth="7" />
    <text y="16" textAnchor="middle" fontSize={text.length > 2 ? 34 : 50} fontWeight="900" fontFamily={FONT_JP} fill={C.ink}>{text}</text>
  </g>
);

export const Cheer = ({ t, lt, b }: SP) => {
  const seg = t < 91.8 ? 0 : t < 94.65 ? 1 : t < 97.65 ? 2 : 3;
  const bgs = ["#8b2d39", "#7c7d83", "#2b6b8a", "#215b7c"];
  const ui = seg < 2;
  const bt = t / (60 / 164);
  const hop = (i: number) => Math.abs(Math.sin(bt * Math.PI + i * 0.9));
  const kinds = ["spark", "knot", "aster", "lens"] as const;
  const confetti = seg === 3 ? 70 : 34;
  return (
    <g>
      <Rect fill={bgs[seg]} />
      <Rays cx={960} cy={300} n={18} rot={lt * 12} color={C.cream} op={0.1} />
      <Dots op={0.3} />
      {/* bunting */}
      <path d="M0 40 Q480 120 960 40 T1920 40" fill="none" stroke={C.ink} strokeWidth="4" />
      {Array.from({ length: 16 }).map((_, i) => {
        const x = 60 + i * 120;
        return <polygon key={i} points={`${x - 30},${58 + Math.sin(i * 0.8) * 30} ${x + 30},${58 + Math.sin(i * 0.8) * 30} ${x},${130 + Math.sin(i * 0.8) * 30 + Math.sin(lt * 4 + i) * 6}`} fill={[C.mustard, C.cream, C.rose, C.tealLt][i % 4]} stroke={C.ink} strokeWidth="4" />;
      })}
      {Array.from({ length: confetti }).map((_, i) => (
        <rect key={i} x={rnd(i) * 1920 + Math.sin(lt * 2 + i) * 30} y={((rnd(i + 5) * 900 + lt * (120 + rnd(i) * 120)) % 900) - 60} width="14" height="22" fill={[C.cream, C.mustard, C.rose, C.tealLt, C.coral][i % 5]} opacity="0.85" transform={`rotate(${lt * 200 * rnd(i + 2)} ${rnd(i) * 1920} 400)`} />
      ))}
      {/* the lead symbol */}
      <g transform={`translate(960 ${250 - hop(0) * 38}) scale(${1.25 + b.pulse * 0.1})`}>
        {ui ? <UiSigil shake={Math.sin(t * 40) * 2} /> : <MikuSigil sway={Math.sin(t * 7) * 8} />}
      </g>
      {/* four AI cheerers */}
      {kinds.map((k, i) => {
        const x = [330, 640, 1280, 1590][i];
        const y = 505 - hop(i + 1) * 50;
        return (
          <g key={k}>
            <g transform={`translate(${x} ${y}) scale(0.9)`}><AISigil kind={k} /></g>
            <Fan x={x + (i < 2 ? 112 : -112)} y={y - 120 - hop(i) * 18} text={ui ? "雨衣" : "ミク"} tilt={Math.sin(bt * Math.PI + i) * 18} bg={C.bone} />
          </g>
        );
      })}
      <rect y="690" width="1920" height="390" fill={C.ink} opacity="0.25" />
      <Vignette />
    </g>
  );
};

