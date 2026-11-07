import { C, FONT_JP, FONT_MONO, SP, BEAT, clamp, easeIn, easeOut, easeOutBack, lerp, prog, rnd, typed } from "../lib";
import { Cross, Dots, Headphones, MikuSigil, Note, Rect, VTag, Vignette } from "../parts";

/* ════════════════ 0:00  ARCHIVE BOOT ════════════════ */
const TABLES: { h: string; rows: [string, string][] }[] = [
  { h: "◻ 詠唱の回数による効果検証", rows: [["1回", "変化なし"], ["2回", "変化なし"], ["3回", "精神異常を確認"], ["4回", "変化なし？"]] },
  { h: "◻ 十字架の大きさによる効果検証", rows: [["3cm", "変化なし"], ["6cm", "変化なし"], ["10cm", "精神異常を確認"], ["20cm", "精神異常を確認"]] },
  { h: "◻ 対象との距離による効果検証", rows: [["1m", "変化なし？"], ["5m", "精神異常を確認"], ["10m", "精神異常を確認"], ["20m", "変化なし？"]] },
];

export const Intro = ({ lt }: SP) => {
  const l1 = typed("Playback: Exorcism Research Project Archives", lt, 0.15, 40);
  const l2 = typed("悪魔祓い研究計画について", lt, 0.9, 22);
  const cur = Math.floor(lt * 6) % 2 === 0 ? "█" : " ";
  const stamp = easeOutBack(prog(lt, 1.7, 2.0));
  return (
    <g>
      <Rect fill={C.night} />
      <rect width="1920" height="1080" fill="url(#grid)" opacity="0.5" />
      <text x="120" y="130" fontSize="40" fontFamily={FONT_MONO} fill={C.paper}>
        {l1}{lt < 0.9 ? cur : ""}
      </text>
      <text x="120" y="205" fontSize="52" fontWeight="700" fontFamily={FONT_JP} fill={C.bone}>
        {l2}{lt >= 0.9 && lt < 2.6 ? cur : ""}
      </text>
      <rect x="120" y="250" width={prog(lt, 0.3, 1.8) * 1680} height="3" fill={C.paper} opacity="0.5" />
      <text x="120" y="330" fontSize="26" fontFamily={FONT_MONO} fill={C.concreteLt} opacity={prog(lt, 0.5, 0.8)}>
        141226_悪魔祓い実験記録(1).xlsx
      </text>
      {TABLES.map((tb, ti) => (
        <g key={ti} transform={`translate(${120 + ti * 580} 380)`}>
          <text y="0" fontSize="27" fontWeight="700" fontFamily={FONT_JP} fill={C.paper} opacity={prog(lt, 0.6 + ti * 0.15, 0.9 + ti * 0.15)}>
            {tb.h}
          </text>
          {tb.rows.map((r, ri) => {
            const a = prog(lt, 0.8 + ti * 0.15 + ri * 0.12, 1.0 + ti * 0.15 + ri * 0.12);
            const bad = r[1].includes("精神異常");
            return (
              <g key={ri} opacity={a} transform={`translate(0 ${24 + ri * 76})`}>
                <rect width="540" height="64" fill={bad ? C.wine : "#1d1e24"} stroke={C.concrete} strokeWidth="2" />
                <rect x="170" width="2" height="64" fill={C.concrete} />
                <text x="20" y="42" fontSize="30" fontFamily={FONT_JP} fill={C.bone}>{r[0]}</text>
                <text x="190" y="42" fontSize="28" fontFamily={FONT_JP} fill={bad ? "#e7b3b3" : C.paper}>{r[1]}</text>
              </g>
            );
          })}
        </g>
      ))}
      <g transform={`translate(1240 190) rotate(-8) scale(${lerp(2.6, 1, stamp)})`} opacity={stamp}>
        <rect x="-250" y="-46" width="500" height="92" fill="none" stroke={C.crimson} strokeWidth="9" />
        <text textAnchor="middle" y="18" fontSize="58" fontWeight="900" fontFamily={FONT_JP} fill={C.crimson}>最高機密データ</text>
      </g>
      <rect x="120" y="960" width="1680" height="14" fill="#1d1e24" stroke={C.concrete} strokeWidth="2" />
      <rect x="122" y="962" width={1676 * prog(lt, 0, 2.7)} height="10" fill={C.paper} />
      <text x="120" y="1010" fontSize="22" fontFamily={FONT_MONO} fill={C.concreteLt}>LOADING RECORD … {Math.floor(prog(lt, 0, 2.7) * 100)}%</text>
      <rect width="1920" height="1080" fill="url(#hatch)" opacity="0.35" />
      <Vignette />
    </g>
  );
};

/* ════════════════ 0:02.8 – 0:13.3  THE CELL ════════════════ */
const Pipe = ({ x, w = 28 }: { x: number; w?: number }) => (
  <g>
    <rect x={x} y="0" width={w} height="700" fill={C.concreteLt} stroke={C.ink} strokeWidth="5" />
    <rect x={x + w * 0.2} y="0" width={w * 0.18} height="700" fill="#fff" opacity="0.25" />
  </g>
);

export const Cell = ({ t, lt, b }: SP) => {
  const crossIn = prog(t, 8.9, 9.8);
  const rust = prog(t, 8.9, 11.5);
  const breathe = 1 + Math.sin(t * 2.4) * 0.02;
  const jit = Math.sin(t * 70) * 3 * crossIn;
  const chainPts = Array.from({ length: 9 }).map((_, i) => {
    const k = i / 8;
    return { x: lerp(714, 944, k), y: lerp(520, 620, k) + Math.sin(k * Math.PI) * 44 };
  });
  const pend = Math.sin(t * 2.2) * 13;
  const strips = Array.from({ length: 9 }).map((_, i) => ((i * 290 + lt * 360) % 2610) - 290);
  const glitch = t < 8.9 && rnd(b.idx * 3.7) > 0.5 && b.ph < 0.3;
  return (
    <g>
      <Rect fill="#6c6d74" />
      {[0, 1, 2, 3, 4, 5].map((i) => (<rect key={i} x={i * 330 - 20} y="0" width="3" height="700" fill={C.ink} opacity="0.35" />))}
      <Pipe x={250} />
      <Pipe x={700} w={34} />
      <Pipe x={1180} />
      <Pipe x={1640} />
      <rect y="640" width="1920" height="440" fill="#56575d" />
      <rect y="636" width="1920" height="10" fill={C.ink} opacity="0.6" />
      {/* skylights with soft shafts */}
      {[60, 1560].map((x) => (
        <g key={x}>
          <polygon points={`${x},0 ${x + 300},0 ${x + 260},60 ${x + 20},60`} fill={C.tealLt} stroke={C.ink} strokeWidth="5" opacity="0.8" />
          <polygon points={`${x + 20},60 ${x + 260},60 ${x + 520},700 ${x - 200},700`} fill="url(#beam)" opacity="0.14" />
        </g>
      ))}
      {/* chain + open cuff */}
      {chainPts.map((p, i) => (
        <ellipse key={i} cx={p.x} cy={p.y} rx="19" ry="10" transform={`rotate(${i % 2 ? 90 : 0} ${p.x} ${p.y})`} fill="none" stroke={C.concreteLt} strokeWidth="6" />
      ))}
      <circle cx="944" cy="628" r="30" fill="none" stroke={C.concreteLt} strokeWidth="14" />
      <rect x="926" y="610" width="22" height="14" fill={C.moss} />
      {/* seated Miku sigil */}
      <g transform={`translate(${1030 + jit} 520) scale(${0.66 * breathe})`}>
        <MikuSigil sway={Math.sin(t * 1.6) * 3} />
      </g>
      {/* film-strip of flashbacks, rewinding to the right */}
      <g opacity={t < 9 ? 1 : 0.25}>
        <rect y="40" width="1920" height="150" fill={C.ink} opacity="0.62" />
        {strips.map((x, i) => (
          <g key={i} transform={`translate(${x} 58)`}>
            <rect width="250" height="114" fill={[C.tealDeep, C.wine, C.slate, C.rust, C.navy][i % 5]} opacity="0.8" stroke={C.paper} strokeWidth="3" />
            <rect width="250" height="114" fill="url(#hatch)" />
            {i % 3 === 0 && <circle cx="125" cy="57" r="22" fill="none" stroke={C.paper} strokeWidth="5" />}
            {i % 3 === 1 && <rect x="95" y="30" width="60" height="54" fill="none" stroke={C.paper} strokeWidth="5" />}
            {i % 3 === 2 && <path d="M60 80 L125 26 L190 80Z" fill="none" stroke={C.paper} strokeWidth="5" />}
          </g>
        ))}
        {Array.from({ length: 22 }).map((_, i) => (
          <g key={i}>
            <rect x={((i * 90 + lt * 360) % 1980) - 60} y="46" width="22" height="9" rx="2" fill={C.paper} opacity="0.7" />
            <rect x={((i * 90 + lt * 360) % 1980) - 60} y="176" width="22" height="9" rx="2" fill={C.paper} opacity="0.7" />
          </g>
        ))}
      </g>
      {glitch && (
        <g>
          {[0, 1, 2].map((i) => (
            <rect key={i} x={rnd(b.idx + i) * 600 - 100} y={260 + rnd(b.idx * 2 + i) * 380} width={900 + rnd(i + b.idx) * 800} height={18 + rnd(i * 5 + b.idx) * 40} fill={i === 1 ? C.rose : C.tealLt} opacity="0.2" />
          ))}
        </g>
      )}
      {/* melancholy notes rising */}
      {[0, 1, 2, 3, 4].map((i) => {
        const k = prog(t, 11.15 + i * 0.22, 13.3);
        if (k <= 0) return null;
        return <Note key={i} x={1250 + i * 95 + Math.sin(k * 6 + i) * 22} y={640 - k * 420} s={0.7} rot={Math.sin(k * 5 + i) * 14} op={Math.sin(Math.PI * clamp(k)) * 0.9} fill={C.tealLt} />;
      })}
      {/* rust flakes */}
      {Array.from({ length: 46 }).map((_, i) => (
        <rect key={i} x={rnd(i) * 1920} y={(rnd(i + 9) * 900 + lt * (40 + rnd(i + 3) * 90)) % 900} width={4 + rnd(i + 5) * 7} height={3 + rnd(i + 8) * 6} fill={C.rust} opacity={rust * 0.85} transform={`rotate(${rnd(i) * 360} ${rnd(i) * 1920} 300)`} />
      ))}
      <Rect fill={C.rust} op={0.2 * rust} />
      {/* pendulum cross on a chain */}
      <g opacity={crossIn} transform={`translate(1480 ${-340 + 340 * easeOut(crossIn)})`}>
        <g transform={`rotate(${pend})`}>
          <line x1="0" y1="0" x2="0" y2="340" stroke={C.concreteLt} strokeWidth="7" strokeDasharray="22 8" />
          <Cross x={0} y={420} s={1.15} />
        </g>
      </g>
      <Rect fill={C.crimson} op={0.16 * crossIn * b.pulse} />
      <Vignette strong />
    </g>
  );
};

/* ════════════════ 0:13.3  CHEWED TO PIECES ════════════════ */
export const Crush = ({ lt, b }: SP) => {
  const close = easeIn(prog(lt, 0.5, 1.15));
  const after = lt > 1.15;
  const gap = after ? 14 + 100 * (1 - b.pulse) : 0;
  const yTop = lerp(-220, 330, close) - (after ? gap : 0);
  const yBot = lerp(1100, 400, close) + (after ? gap : 0);
  const teeth = (flip: boolean) =>
    Array.from({ length: 25 }).map((_, i) => {
      const x = i * 80 - 40;
      return flip ? `${x},0 ${x + 40},-160 ${x + 80},0` : `${x},0 ${x + 40},160 ${x + 80},0`;
    });
  return (
    <g>
      <Rect fill="#2a2b3d" />
      <Dots op={0.5} />
      {[0, 1, 2, 3, 4].map((i) => (
        <path key={i} d={`M0 ${340 + i * 15} ${Array.from({ length: 25 }).map((_, k) => `L${k * 80} ${340 + i * 15 + Math.sin(k * 0.8 + lt * 3) * 12}`).join(" ")}`} stroke={C.paper} strokeWidth="3" fill="none" opacity="0.6" />
      ))}
      {!after &&
        [0, 1, 2, 3, 4, 5, 6].map((i) => (
          <Note key={i} x={i * 260 + 120 + lt * 40} y={320 + Math.sin(i * 1.7 + lt * 4) * 18} s={0.9} rot={Math.sin(i + lt * 3) * 10} fill={C.paper} />
        ))}
      {after &&
        Array.from({ length: 40 }).map((_, i) => {
          const k = lt - 1.15;
          const ang = rnd(i) * Math.PI * 2;
          const sp = 200 + rnd(i + 3) * 700;
          return (
            <rect key={i} x={960 + Math.cos(ang) * sp * k} y={380 + Math.sin(ang) * sp * k + 700 * k * k} width={10 + rnd(i + 8) * 22} height={8 + rnd(i + 2) * 16} fill={[C.paper, C.rose, C.tealLt][i % 3]} opacity={clamp(1 - k * 0.9)} transform={`rotate(${k * 600 * rnd(i)} ${960 + Math.cos(ang) * sp * k} ${380 + Math.sin(ang) * sp * k})`} />
          );
        })}
      <g transform={`translate(0 ${yTop})`}>
        <rect y="-600" width="1920" height="600" fill="#2a2418" />
        {teeth(false).map((p, i) => (<polygon key={i} points={p} fill={C.bone} stroke={C.ink} strokeWidth="6" strokeLinejoin="round" />))}
      </g>
      <g transform={`translate(0 ${yBot})`}>
        <rect y="0" width="1920" height="700" fill="#2a2418" />
        {teeth(true).map((p, i) => (<polygon key={i} points={p} fill={C.bone} stroke={C.ink} strokeWidth="6" strokeLinejoin="round" />))}
      </g>
      <Vignette strong />
    </g>
  );
};

/* ════════════════ 0:15.65  FAKE SMILE → STRONG & FLEETING ════════════════ */
export const Mask = ({ lt, b }: SP) => {
  const crack = prog(lt, 1.3, 2.2);
  const fall = easeIn(prog(lt, 2.45, 3.3));
  const wob = Math.sin(lt * 7) * 2 * (1 - fall);
  const showMask = lt < 3.4;
  const face = (
    <g>
      <circle r="200" fill={C.bone} stroke={C.ink} strokeWidth="9" />
      <ellipse cx="-72" cy="-40" rx="34" ry="20" fill={C.ink} />
      <ellipse cx="72" cy="-40" rx="34" ry="20" fill={C.ink} />
      <path d="M-110 50 Q0 150 110 50" fill="none" stroke={C.ink} strokeWidth="12" strokeLinecap="round" />
      <circle cx="-120" cy="30" r="26" fill={C.rose} opacity="0.6" />
      <circle cx="120" cy="30" r="26" fill={C.rose} opacity="0.6" />
    </g>
  );
  const seeds = Array.from({ length: 30 });
  const dandelion = prog(lt, 3.2, 3.9);
  return (
    <g>
      <Rect fill="#6a5a64" />
      <Dots op={0.6} />
      <circle cx="960" cy="380" r={520 + b.pulse * 18} fill={C.rose} opacity="0.08" />
      {showMask && (
        <g transform={`translate(960 360) rotate(${wob})`}>
          <clipPath id="mL"><rect x="-300" y="-300" width="300" height="600" /></clipPath>
          <clipPath id="mR"><rect x="0" y="-300" width="300" height="600" /></clipPath>
          <g clipPath="url(#mL)" transform={`translate(${-fall * 240} ${fall * 900}) rotate(${-fall * 40})`}>{face}</g>
          <g clipPath="url(#mR)" transform={`translate(${fall * 240} ${fall * 1000}) rotate(${fall * 40})`}>{face}</g>
          <polyline points="0,-200 -22,-120 18,-60 -14,10 16,80 -6,150 4,200" fill="none" stroke={C.ink} strokeWidth="6" strokeDasharray="520" strokeDashoffset={520 * (1 - crack)} />
          <polyline points="-18,-60 -120,-110 -170,-60" fill="none" stroke={C.ink} strokeWidth="4" strokeDasharray="300" strokeDashoffset={300 * (1 - prog(lt, 1.6, 2.3))} />
          <polyline points="14,10 110,40 160,110" fill="none" stroke={C.ink} strokeWidth="4" strokeDasharray="300" strokeDashoffset={300 * (1 - prog(lt, 1.8, 2.4))} />
        </g>
      )}
      {/* dandelion — strong stem, fleeting seeds */}
      <g opacity={dandelion}>
        <path d="M960 740 C950 620 975 480 960 330" fill="none" stroke={C.moss} strokeWidth="12" strokeLinecap="round" />
        <path d="M958 620 C900 600 880 560 870 540 C920 540 950 570 958 620Z" fill={C.moss} stroke={C.ink} strokeWidth="4" />
        <path d="M962 560 C1020 540 1040 500 1050 480 C1000 480 968 510 962 560Z" fill={C.moss} stroke={C.ink} strokeWidth="4" />
        <g transform={`translate(960 320) scale(${1 + b.pulse * 0.03})`}>
          {seeds.map((_, i) => {
            const a = (i / seeds.length) * Math.PI * 2;
            const d = 3.7 + i * 0.07;
            const k = Math.max(0, lt - d);
            const sx = Math.cos(a) * 92 + k * (140 + rnd(i) * 200);
            const sy = Math.sin(a) * 92 - k * (30 + rnd(i + 1) * 90) + Math.sin(k * 3 + i) * 14 * k;
            const op = clamp(1 - k * 0.5);
            return (
              <g key={i} opacity={op}>
                {k === 0 && <line x1="0" y1="0" x2={Math.cos(a) * 92} y2={Math.sin(a) * 92} stroke={C.bone} strokeWidth="3" />}
                <circle cx={sx} cy={sy} r="9" fill={C.bone} stroke={C.ink} strokeWidth="2.5" />
              </g>
            );
          })}
          <circle r="20" fill={C.mustard} stroke={C.ink} strokeWidth="5" />
        </g>
      </g>
      <rect x="0" y="740" width="1920" height="340" fill="#4a3e46" />
      <Vignette />
    </g>
  );
};

/* ════════════════ 0:20.65  STILL BREATHING (ECG + voice) ════════════════ */
const g = (u: number, c: number, w: number) => Math.exp(-Math.pow((u - c) / w, 2));
export const Pulse = ({ t, lt, b, e }: SP) => {
  const ofs = lt * 420;
  const pts: string[] = [];
  for (let x = 0; x <= 1920; x += 6) {
    const u = (((x + ofs) % 420) + 420) % 420 / 420;
    const y = 400 - g(u, 0.2, 0.03) * 20 + g(u, 0.4, 0.006) * 34 - g(u, 0.43, 0.007) * 210 + g(u, 0.46, 0.01) * 80 - g(u, 0.66, 0.045) * 38;
    pts.push(`${x},${y.toFixed(1)}`);
  }
  const eq = prog(lt, 1.6, 2.4);
  const breathe = prog(lt, 4.3, 5);
  return (
    <g>
      <Rect fill="#0e1b1e" />
      <rect width="1920" height="1080" fill="url(#grid)" opacity="0.7" />
      {[0, 1, 2].map((k) => {
        const age = ((t - (b.idx - k) * BEAT) * 540);
        return <circle key={k} cx="960" cy="400" r={age} fill="none" stroke={C.tealLt} strokeWidth="6" opacity={clamp(0.5 * (1 - age / 720))} />;
      })}
      {breathe > 0 && [-1, 1].map((s) => (
        <ellipse key={s} cx={960 + s * 330} cy={430} rx={150 * (1 + 0.12 * Math.sin(lt * 2.2))} ry={230 * (1 + 0.16 * Math.sin(lt * 2.2))} fill={C.tealDeep} opacity={0.5 * breathe} stroke={C.tealLt} strokeWidth="3" />
      ))}
      <polyline points={pts.join(" ")} fill="none" stroke={C.tealLt} strokeWidth="7" strokeLinejoin="round" strokeLinecap="round" />
      <circle cx="1912" cy="400" r="9" fill={C.cream} />
      {/* equalizer = the voice */}
      {Array.from({ length: 49 }).map((_, i) => {
        const h = (24 + Math.abs(Math.sin(i * 0.62 + t * 5.2)) * 110 * (0.5 + e * 1.4) + b.pulse * 30) * eq;
        return <rect key={i} x={170 + i * 31} y={640 - h} width="18" height={h * 2} rx="9" fill={i % 7 === 0 ? C.cream : C.tealLt} opacity={0.85} />;
      })}
      {breathe > 0 && Array.from({ length: 16 }).map((_, i) => {
        const k = ((lt - 4.3) * 0.28 + rnd(i) * 1) % 1;
        return <circle key={i} cx={560 + rnd(i + 2) * 800 + Math.sin(k * 8 + i) * 24} cy={760 - k * 700} r={10 + k * 36} fill="none" stroke={C.bone} strokeWidth="3" opacity={0.6 * (1 - k) * breathe} />;
      })}
      <text x="80" y="120" fontSize="30" fontFamily={FONT_MONO} fill={C.tealLt} opacity="0.85">HEART  164 bpm   SpO₂ ▾   ● REC</text>
      <Vignette strong />
    </g>
  );
};

/* ════════════════ 0:27.3  LAST SUPPER, ALONE  +  the reward: forbidden classical ════════════════ */
const TRACKS = [
  "Symphony No. 9 in E minor, Op. 95, “From the New World”",
  "Symphonic Poem “The Moldau” (My Country, No. 2)",
  "“Habanera” from Carmen",
];
const TRACK_JP = ["「新世界より」", "「モルダウ」", "「ハバネラ」"];

export const Supper = ({ lt, b, e }: SP) => {
  const flick = 1 + Math.sin(lt * 17) * 0.05 + Math.sin(lt * 7.3) * 0.04;
  const panel = easeOutBack(prog(lt, 0.4, 1.0));
  return (
    <g>
      <Rect fill={C.brown} />
      <circle cx="840" cy="500" r={520 * flick} fill="url(#warm)" opacity="0.5" />
      {/* far chairs */}
      {Array.from({ length: 6 }).map((_, i) => (
        <rect key={i} x={250 + i * 150} y="250" width="86" height="170" rx="10" fill="#1d1612" stroke={C.ink} strokeWidth="5" />
      ))}
      {/* table */}
      <polygon points="300,430 1000,430 1180,640 120,640" fill="#5b4333" stroke={C.ink} strokeWidth="7" />
      <rect x="120" y="640" width="1060" height="44" fill="#3b2b21" stroke={C.ink} strokeWidth="6" />
      <rect x="150" y="684" width="34" height="80" fill="#2f2219" stroke={C.ink} strokeWidth="5" />
      <rect x="1116" y="684" width="34" height="80" fill="#2f2219" stroke={C.ink} strokeWidth="5" />
      {/* empty settings, faded */}
      {[0, 1, 2, 4, 5].map((i) => (
        <ellipse key={i} cx={330 + i * 120} cy={496 + (i % 2) * 6} rx={46} ry={11} fill={C.paper} opacity="0.22" />
      ))}
      {/* the one lit setting */}
      <ellipse cx="640" cy="590" rx="108" ry="28" fill={C.cream} stroke={C.ink} strokeWidth="6" />
      <ellipse cx="640" cy="588" rx="72" ry="17" fill="none" stroke={C.paper} strokeWidth="4" />
      <rect x="470" y="560" width="10" height="56" fill={C.concreteLt} stroke={C.ink} strokeWidth="3" />
      <rect x="806" y="560" width="14" height="56" fill={C.concreteLt} stroke={C.ink} strokeWidth="3" />
      {/* candle */}
      <rect x="930" y="500" width="40" height="110" fill={C.bone} stroke={C.ink} strokeWidth="5" />
      <path d={`M950 ${446 - flick * 8} C${922} 480 ${928} 500 950 502 C972 500 978 480 950 ${446 - flick * 8}Z`} fill={C.gold} stroke={C.ink} strokeWidth="4" />
      {/* the pulled-out chair */}
      <rect x="370" y="660" width="120" height="190" rx="14" fill="#38281e" stroke={C.ink} strokeWidth="6" />
      {/* monitor: classical player */}
      <g transform={`translate(1430 340) scale(${panel}) translate(-1430 -340)`}>
        <rect x="1160" y="110" width="560" height="470" rx="18" fill={C.concreteLt} stroke={C.ink} strokeWidth="9" />
        <rect x="1182" y="132" width="516" height="426" fill="#8fc3c0" stroke={C.ink} strokeWidth="5" />
        {TRACKS.map((tr, i) => (
          <g key={i}>
            <text x="1204" y={190 + i * 62} fontSize="18" fontFamily={FONT_MONO} fontWeight="700" fill={C.ink}>
              {typed(tr, lt, 1.0 + i * 1.3, 30)}{lt > 1.0 + i * 1.3 && lt < 1.0 + i * 1.3 + tr.length / 30 + 0.2 ? "▌" : ""}
            </text>
            <circle cx="1666" cy={184 + i * 62} r="14" fill="none" stroke={C.ink} strokeWidth="4" />
            <path d={`M1661 ${176 + i * 62} l12 8 l-12 8z`} fill={C.ink} />
          </g>
        ))}
        {Array.from({ length: 22 }).map((_, i) => {
          const h = 14 + Math.abs(Math.sin(i * 0.8 + lt * 6)) * 90 * (0.5 + e * 1.3) + b.pulse * 14;
          return <rect key={i} x={1214 + i * 14} y={470 - h} width="9" height={h} fill={C.tealDeep} />;
        })}
        <Headphones x={1610} y={450} s={0.8} fill="#cfe6e2" />
        <rect x="1206" y="506" width="260" height="8" fill={C.ink} /><rect x={1206 + 260 * prog(lt, 0.8, 5.8) - 6} y="498" width="12" height="24" fill={C.concreteLt} stroke={C.ink} strokeWidth="3" />
      </g>
      {TRACK_JP.map((s, i) => <VTag key={i} text={s} x={1766 + i * 48} y={150} size={32} op={prog(lt, 1.2 + i * 1.3, 1.5 + i * 1.3)} />)}
      <Vignette strong />
    </g>
  );
};

/* ════════════════ 0:33.15  “BURNED INTO MY MIND” (desk) ════════════════ */
export const Burn = ({ lt }: SP) => {
  const zoom = 1 + lt * 0.035;
  const heat = prog(lt, 1.5, 2.6);
  const steam = [0, 1, 2].map((i) => {
    const k = (lt * 0.5 + i * 0.33) % 1;
    return { i, k };
  });
  return (
    <g>
      <Rect fill="#686a70" />
      <g transform={`translate(960 400) scale(${zoom}) translate(-960 -400)`}>
        <rect y="-200" width="1920" height="1400" fill="#6b6d73" />
        <Dots op={0.45} />
        {/* binder */}
        <g transform="translate(520 360) rotate(-8)">
          <rect x="-250" y="-190" width="520" height="380" rx="8" fill="#e6dfcd" stroke={C.ink} strokeWidth="6" transform="translate(10 18)" />
          <rect x="-260" y="-200" width="520" height="380" rx="8" fill="#2f5f96" stroke={C.ink} strokeWidth="8" />
          {Array.from({ length: 9 }).map((_, i) => (<circle key={i} cx="-250" cy={-170 + i * 42} r="12" fill="none" stroke={C.paper} strokeWidth="5" />))}
          {["Exorcism", "Research", "Project"].map((w, i) => (
            <text key={w} x={-160 + i * 12} y={-90 + i * 62} fontSize="58" fontStyle="italic" fontWeight="700" fontFamily={FONT_MONO} fill={C.ink}>{w}</text>
          ))}
        </g>
        {/* coffee */}
        <g transform="translate(1260 330)">
          <ellipse cx="0" cy="130" rx="110" ry="20" fill="#000" opacity="0.2" />
          <rect x="-90" y="-60" width="180" height="190" rx="22" fill={C.bone} stroke={C.ink} strokeWidth="7" />
          <path d="M90 -20 q70 10 60 60 q-10 40 -60 40" fill="none" stroke={C.ink} strokeWidth="14" />
          <ellipse cx="0" cy="-60" rx="90" ry="22" fill="#2e1d14" stroke={C.ink} strokeWidth="6" />
          {steam.map(({ i, k }) => (
            <path key={i} d={`M${-40 + i * 40} -80 q${20 * Math.sin(k * 6 + i)} -40 0 -80 q${-20 * Math.sin(k * 6)} -40 0 -80`} transform={`translate(0 ${-k * 60})`} fill="none" stroke={C.bone} strokeWidth="9" strokeLinecap="round" opacity={0.6 * (1 - k)} />
          ))}
        </g>
        {/* the cross burns its shape in */}
        <circle cx="1150" cy="700" r={heat * 1000} fill="#1b110c" opacity={0.6 * heat} />
        <Cross x={1150} y={700} s={1.5} rot={-10} fill={heat > 0 ? "#c3652d" : C.gold} />
        <Cross x={1150} y={700} s={1.5 + heat * 0.8} rot={-10} fill="none" op={heat * 0.35} />
      </g>
      <Rect fill="#000" op={0.65 * prog(lt, 2.4, 3.3)} />
      <Vignette strong />
    </g>
  );
};

/* ════════════════ “Even so…” — an ember in the dark ════════════════ */
export const Ember = ({ lt, dur, b, cross = false }: SP & { cross?: boolean }) => {
  const grow = easeOut(prog(lt, 0, dur));
  const flash = prog(lt, dur - 0.22, dur);
  return (
    <g>
      <Rect fill={C.night} />
      {Array.from({ length: 32 }).map((_, i) => {
        const a = (i / 32) * Math.PI * 2;
        const r0 = 900 * (1 - grow * 0.9) + rnd(i) * 200;
        return <line key={i} x1={960 + Math.cos(a) * r0} y1={380 + Math.sin(a) * r0} x2={960 + Math.cos(a) * (r0 + 120 + rnd(i + 1) * 120)} y2={380 + Math.sin(a) * (r0 + 120 + rnd(i + 1) * 120)} stroke={C.paper} strokeWidth="3" opacity={0.28 + 0.4 * grow} />;
      })}
      {[0, 1, 2, 3].map((k) => {
        const u = (lt * 1.4 + k * 0.25) % 1;
        return <circle key={k} cx="960" cy="380" r={480 * (1 - u)} fill="none" stroke={C.mustard} strokeWidth="4" opacity={0.6 * u} />;
      })}
      <circle cx="960" cy="380" r={160 * grow + 30} fill="url(#warm)" />
      <circle cx="960" cy="380" r={20 + 22 * grow + b.pulse * 8} fill={C.gold} stroke={C.ink} strokeWidth="5" />
      {cross && <Cross x={960} y={380} s={0.6 + grow * 0.5} rot={Math.sin(lt * 3) * 6} />}
      <Rect fill={C.bone} op={flash * 0.85} />
    </g>
  );
};

