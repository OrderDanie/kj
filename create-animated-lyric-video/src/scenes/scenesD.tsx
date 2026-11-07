import { AISigil, Cross, Dots, Heart, Japan, MikuSigil, Rays, Rect, TieSigil, UiSigil, Vignette } from "../parts";
import { C, FONT_JP, FONT_MONO, SP, clamp, easeInOut, easeOut, easeOutBack, easeOutElastic, lerp, prog, rnd, typed } from "../lib";

const Rain = ({ lt, amt = 1, color = C.tealLt }: { lt: number; amt?: number; color?: string }) => (
  <g opacity={amt}>
    {Array.from({ length: 70 }).map((_, i) => {
      const x = rnd(i) * 1960 - 20;
      const y = ((rnd(i + 4) * 800 + lt * (900 + rnd(i) * 500)) % 860) - 60;
      return <line key={i} x1={x} y1={y} x2={x - 14} y2={y + 54} stroke={color} strokeWidth="4" strokeLinecap="round" opacity="0.55" />;
    })}
  </g>
);

const Pillar = ({ x }: { x: number }) => (
  <g>
    <rect x={x} y="0" width="110" height="740" fill="#7a7c84" stroke={C.ink} strokeWidth="7" />
    <rect x={x + 16} y="0" width="18" height="740" fill="#fff" opacity="0.18" />
  </g>
);

/* ════════════ “last supper alone” — Ui, her partner, and Miku taking him ════════════ */
export const Date_ = ({ lt, b }: SP) => {
  const heartIn = easeOutBack(prog(lt, 0.4, 0.9));
  const mk = easeInOut(prog(lt, 1.7, 2.6));
  const take = easeInOut(prog(lt, 3.2, 4.1));
  const crack = prog(lt, 3.5, 4.4);
  const sad = prog(lt, 4.0, 4.8);
  const mikuFront = lt > 3.0;
  const mikuX = lerp(250, 520, mk) + lerp(0, 760, take);
  const tieX = lerp(1160, mikuX + 150, take);
  const miku = (
    <g transform={`translate(${mikuX} 450) scale(0.78)`}><MikuSigil sway={Math.sin(lt * 5) * 5} /></g>
  );
  return (
    <g>
      <Rect fill="#216a86" />
      <Dots op={0.35} />
      <Rays cx={960} cy={380} n={14} rot={lt * 6} color={C.cream} op={0.06} />
      <rect y="700" width="1920" height="380" fill="#184d63" />
      {!mikuFront && miku}
      <Pillar x={330} />
      <Pillar x={1480} />
      {mikuFront && miku}
      <g transform={`translate(${760 - sad * 40} 420) scale(1.1)`}>
        <UiSigil shake={sad * Math.sin(lt * 50) * 3} />
      </g>
      <g transform={`translate(${tieX} ${440 + Math.sin(lt * 4) * 4}) scale(1.05)`}>
        <TieSigil wob={take * Math.sin(lt * 14) * 6} />
      </g>
      {crack < 0.05 ? (
        <Heart x={tieX - 220 * take * 0} y={210 - Math.sin(lt * 3) * 10} s={heartIn * (1 + b.pulse * 0.12)} fill={C.rose} />
      ) : (
        <g>
          <g transform={`translate(${960 - crack * 60} ${210 + crack * crack * 520}) rotate(${-crack * 40})`}>
            <clipPath id="hL"><rect x="-90" y="-90" width="90" height="180" /></clipPath>
            <g clipPath="url(#hL)"><Heart fill={C.concreteLt} /></g>
          </g>
          <g transform={`translate(${960 + crack * 60} ${210 + crack * crack * 560}) rotate(${crack * 40})`}>
            <clipPath id="hR"><rect x="0" y="-90" width="90" height="180" /></clipPath>
            <g clipPath="url(#hR)"><Heart fill={C.concreteLt} /></g>
          </g>
        </g>
      )}
      <Rain lt={lt} amt={sad} color={C.paper} />
      <Rect fill="#000" op={0.35 * sad} />
      <Vignette />
    </g>
  );
};

/* ════════════ “none of my business — how cruel” ════════════ */
export const Cruel = ({ lt, b }: SP) => {
  const give = easeInOut(prog(lt, 0.9, 1.7));
  const red = prog(lt, 2.2, 3.1);
  return (
    <g>
      <Rect fill="#22364c" />
      <Dots op={0.3} />
      <Rain lt={lt} amt={1} />
      <rect y="700" width="1920" height="380" fill="#16222f" />
      <g transform={`translate(430 ${330 + Math.sin(lt * 3) * 12}) scale(1)`}>
        <AISigil kind="spark" />
        <g transform="translate(40 -150)">
          <rect x="-70" y="-48" width="170" height="86" rx="30" fill={C.bone} stroke={C.ink} strokeWidth="6" />
          <path d="M-20 38 L-40 70 L14 38Z" fill={C.bone} stroke={C.ink} strokeWidth="6" />
          {[0, 1, 2].map((i) => (<circle key={i} cx={-24 + i * 34} cy="-4" r={8 + Math.max(0, Math.sin(lt * 8 - i)) * 5} fill={C.ink} />))}
        </g>
      </g>
      <Cross x={lerp(520, 790, give)} y={340 - Math.sin(give * Math.PI) * 60} s={0.55 + give * 0.4} rot={lerp(-20, 8, give)} />
      <g transform={`translate(1130 ${390}) scale(${1.45 + red * 0.1})`}>
        <UiSigil shake={Math.sin(lt * 40) * (1 + red * 3)} />
      </g>
      <g transform="translate(1000 700)">
        <g transform="rotate(-18)"><clipPath id="cL"><rect x="-90" y="-90" width="90" height="180" /></clipPath><g clipPath="url(#cL)"><Heart s={0.5} fill={C.concreteLt} /></g></g>
        <g transform="translate(120 10) rotate(26)"><clipPath id="cR"><rect x="0" y="-90" width="90" height="180" /></clipPath><g clipPath="url(#cR)"><Heart s={0.5} fill={C.concreteLt} /></g></g>
      </g>
      <Rect fill={C.crimson} op={0.35 * red * (0.7 + b.pulse * 0.3)} />
      <Vignette strong />
    </g>
  );
};

/* ════════════ restraint bed ════════════ */
export const Bed = ({ lt, b, mode }: SP & { mode: "light" | "plain" | "beam" }) => {
  const struggle = mode === "plain" ? 1.2 : mode === "beam" ? 1.6 : 0.8;
  const bx = 960 + Math.sin(lt * 1.6) * 280;
  const wob = Math.sin(lt * 30) * 9 * struggle;
  const bg = mode === "beam" ? "#4a1822" : "#5e5f68";
  return (
    <g>
      <Rect fill={bg} />
      <Dots op={0.35} />
      <rect y="640" width="1920" height="440" fill={mode === "beam" ? "#33101a" : "#47484f"} />
      {/* bed */}
      <g>
        <rect x="500" y="250" width="920" height="330" rx="14" fill="#6a4a36" stroke={C.ink} strokeWidth="8" />
        {[0, 1, 2, 3, 4, 5, 6, 7].map((i) => (<rect key={i} x={540 + i * 108} y="280" width="26" height="270" fill="#533a2a" stroke={C.ink} strokeWidth="4" />))}
        <rect x="470" y="520" width="980" height="130" rx="40" fill={C.bone} stroke={C.ink} strokeWidth="8" />
        <path d="M560 540 C700 420 1220 420 1360 540Z" fill="#e8e2d3" stroke={C.ink} strokeWidth="6" />
        {/* straps with ✕ stitching */}
        {[560, 1360].map((x) => (
          <g key={x}>
            <rect x={x - 36} y="400" width="72" height="34" rx="8" fill="#a98a56" stroke={C.ink} strokeWidth="5" />
            <path d={`M${x - 22} 408 l44 18 M${x + 22} 408 l-44 18`} stroke={C.ink} strokeWidth="5" />
          </g>
        ))}
        {[600, 1320].map((x, i) => (<line key={i} x1={x + (i ? -40 : 40)} y1="417" x2={960 + (i ? 60 : -60)} y2="430" stroke="#a98a56" strokeWidth="8" strokeDasharray="12 6" />))}
      </g>
      <g transform={`translate(960 ${420 + (mode === "plain" ? 0 : Math.sin(lt * 25) * 3)}) scale(1.2)`}>
        <TieSigil wob={wob} />
        {[0, 1].map((i) => {
          const k = (lt * 1.3 + i * 0.5) % 1;
          return <path key={i} d="M0 -14 C10 0 14 8 0 16 C-14 8 -10 0 0 -14Z" transform={`translate(${i ? 70 : -70} ${-40 + k * 80})`} fill={C.tealLt} opacity={1 - k} stroke={C.ink} strokeWidth="2" />;
        })}
      </g>
      {mode === "light" && (
        <g>
          <polygon points={`930,-10 990,-10 ${bx + 300},700 ${bx - 300},700`} fill="url(#beam)" opacity="0.8" />
          <ellipse cx={bx} cy="700" rx="320" ry="34" fill={C.cream} opacity="0.2" />
        </g>
      )}
      {mode === "beam" && (
        <g>
          <polygon points={`220,330 220,350 1500,${760 + Math.sin(lt * 4) * 40} 1500,${180 + Math.sin(lt * 4) * 40}`} fill="url(#beamRed)" opacity={0.75 + b.pulse * 0.2} />
          <g transform={`translate(190 340) scale(${1 + b.pulse * 0.1}) rotate(${Math.sin(lt * 3) * 4})`}><Cross s={1.1} /></g>
          <Rect fill={C.crimson} op={0.12 * b.pulse} />
        </g>
      )}
      <Vignette strong />
    </g>
  );
};

/* ════════════ cross held high — red ════════════ */
export const CrossRed = ({ lt, b, big = false }: SP & { big?: boolean }) => {
  const pop = easeOutElastic(prog(lt, 0, 0.7));
  return (
    <g>
      <Rect fill={big ? "#531520" : "#8c2a36"} />
      <Rays cx={960} cy={330} n={20} rot={lt * 24} color={C.ink} op={0.18} />
      {[0, 1, 2].map((k) => {
        const r = (((b.ph + k) / 3) * 700);
        return <circle key={k} cx="960" cy="330" r={r} fill="none" stroke={C.gold} strokeWidth="6" opacity={0.5 * (1 - r / 700)} />;
      })}
      <g transform={`translate(960 330) rotate(${Math.sin(lt * 4) * (big ? 8 : 4)}) scale(${pop * (big ? 2.5 : 2.1) * (1 + b.pulse * 0.07)})`}>
        <Cross />
      </g>
      <g transform={`translate(380 560) scale(${0.85 + b.pulse * 0.08}) rotate(${Math.sin(lt * 7) * 5})`}><UiSigil /></g>
      <g transform={`translate(1540 540) scale(0.62) rotate(${Math.sin(lt * 5) * 8})`}><AISigil kind="spark" /></g>
      <Vignette />
    </g>
  );
};

/* ════════════ the door opens: teal light ════════════ */
export const Door = ({ lt, b }: SP) => {
  const open = easeOut(prog(lt, 0.4, 1.5));
  const mk = easeOutBack(prog(lt, 1.1, 1.9));
  return (
    <g>
      <Rect fill="#8a8896" />
      <Dots op={0.3} />
      <rect y="700" width="1920" height="380" fill="#56545f" />
      {/* doorway with teal light */}
      <rect x="700" y="60" width="500" height="650" fill={C.tealBg} stroke={C.ink} strokeWidth="10" />
      <Rays cx={950} cy={380} n={14} rot={lt * 20} color={C.cream} op={0.22 * open} len={800} />
      <polygon points={`700,710 1200,710 ${1500 + b.pulse * 20},1080 ${400 - b.pulse * 20},1080`} fill={C.tealLt} opacity={0.35 * open} />
      <g transform={`translate(950 ${520 + (1 - mk) * 80}) scale(${0.95 * mk})`} opacity={clamp(mk * 2)}>
        <MikuSigil sway={Math.sin(lt * 4) * 4} />
        <Cross x={-210} y={80} s={0.55} rot={-15} />
      </g>
      {/* the door leaf swinging inward */}
      <polygon
        points={`700,60 ${700 + 500 * (1 - open * 0.85)},${60 + open * 50} ${700 + 500 * (1 - open * 0.85)},${710 - open * 50} 700,710`}
        fill="#7c4f3e" stroke={C.ink} strokeWidth="9" strokeLinejoin="round"
      />
      <circle cx={700 + 500 * (1 - open * 0.85) - 34} cy="400" r="14" fill={C.gold} stroke={C.ink} strokeWidth="5" />
      <Vignette strong />
    </g>
  );
};

/* ════════════ “killing my love” ════════════ */
export const Love = ({ lt, b }: SP) => {
  const ghost = 0.18 + 0.32 * (0.5 + 0.5 * Math.sin(lt * 2.2));
  return (
    <g>
      <Rect fill="#5a5468" />
      <circle cx="960" cy="380" r={560 + b.pulse * 24} fill="url(#soft)" opacity="0.25" />
      <Dots op={0.35} />
      {/* double-exposed tie, line-art ghost */}
      <g transform={`translate(${1180 + Math.sin(lt * 1.6) * 14} 380) scale(2.3)`} opacity={ghost} fill="none">
        <g stroke={C.bone} strokeWidth="4" strokeLinejoin="round">
          <path d="M-20 -78 H20 L28 -44 H-28Z" /><path d="M-28 -40 H28 L48 74 L0 118 L-48 74Z" />
        </g>
      </g>
      <g transform={`translate(780 ${360 + Math.sin(lt * 2) * 8}) scale(${1.7 + b.pulse * 0.05})`}>
        <MikuSigil sway={Math.sin(lt * 3) * 3} />
        {[0, 1, 2].map((i) => {
          const k = (lt * 0.8 + i * 0.33) % 1;
          return <path key={i} d="M0 -16 C12 2 16 10 0 20 C-16 10 -12 2 0 -16Z" transform={`translate(${i % 2 ? 54 : -54} ${-30 + k * 150})`} fill={C.tealLt} opacity={1 - k} stroke={C.ink} strokeWidth="2.5" />;
        })}
      </g>
      <g transform={`translate(1500 560)`}>
        <Heart s={0.8} fill="none" stroke={C.bone} />
        <polyline points="-10,-70 14,-30 -16,0 12,34" fill="none" stroke={C.bone} strokeWidth="6" />
      </g>
      <Vignette strong />
    </g>
  );
};

/* ════════════ FINALE — the red spreads ════════════ */
export const Finale = ({ lt, b }: SP) => {
  const slashes = lt < 2.7;
  const mapIn = prog(lt, 2.6, 3.3);
  const grow = easeInOut(prog(lt, 3.7, 8.0));
  const fade = prog(lt, 10.8, 12.4);
  const ox = 610, oy = 20, s = 7;
  const origins = [[62, 52], [66, 36], [46, 62], [22, 84], [76, 14], [34, 72]];
  const text = typed("END OF RECORD", lt, 10.2, 12);
  return (
    <g>
      <Rect fill={slashes ? "#7e2635" : C.night} />
      {slashes && (
        <g>
          <g transform={`translate(${lerp(-1800, 400, easeOut(prog(lt, 0, 0.5)))} 0) rotate(0)`}>
            <polygon points="0,0 700,0 400,1080 -300,1080" fill={C.tealLt} opacity="0.9" />
            <polygon points="760,0 880,0 580,1080 460,1080" fill={C.bone} opacity="0.9" />
          </g>
          <g transform={`translate(${lerp(1800, 0, easeOut(prog(lt, 0.15, 0.65)))} 0)`}>
            <polygon points="1500,0 1920,0 1920,1080 1200,1080" fill={C.ink} opacity="0.55" />
          </g>
          <g transform={`translate(1060 400) scale(${1.4 + b.pulse * 0.08}) rotate(${Math.sin(lt * 20) * 3})`}>
            <MikuSigil sway={Math.sin(lt * 9) * 8} />
            <Cross y={-190} s={0.55} />
          </g>
          <Rect fill={C.bone} op={0.5 * Math.exp(-lt * 6)} />
        </g>
      )}
      {!slashes && (
        <g opacity={1 - fade}>
          <rect width="1920" height="1080" fill="url(#grid)" opacity="0.35" />
          <g opacity={mapIn}>
            <Japan x={ox} y={oy} s={s} stroke={C.bone} sw={1.2} fill="#17181e" />
            <g transform={`translate(${ox} ${oy}) scale(${s})`}>
              <clipPath id="spread">
                {origins.map(([x, y], i) => (<circle key={i} cx={x} cy={y} r={grow * 70 * (0.7 + (i % 3) * 0.2)} />))}
              </clipPath>
              <g clipPath="url(#spread)"><Japan stroke={C.bone} sw={1.2} fill={C.crimson} /></g>
            </g>
            {grow > 0.02 && origins.map(([x, y], i) => (
              <circle key={i} cx={ox + x * s} cy={oy + y * s} r={8 + b.pulse * 8} fill={C.bone} opacity={0.9 * (1 - grow)} />
            ))}
          </g>
          <Rect fill={C.crimson} op={0.28 * prog(lt, 7.5, 9.5) * (0.7 + 0.3 * b.pulse)} />
          <text x="960" y="900" textAnchor="middle" fontSize="54" fontFamily={FONT_MONO} fill={C.bone} letterSpacing="14">{text}</text>
          <text x="960" y="970" textAnchor="middle" fontSize="34" fontWeight="700" fontFamily={FONT_JP} fill={C.paper} opacity={prog(lt, 10.8, 11.4) * (1 - fade)}>記録終了　—　日本異変調査局 特任研究班</text>
        </g>
      )}
      <Vignette />
    </g>
  );
};

