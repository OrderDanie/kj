import type { ReactNode } from "react";
import type { SP } from "./lib";
import { Burn, Cell, Crush, Ember, Intro, Mask, Pulse, Supper } from "./scenes/scenesA";
import { Curtain, Demon, Lantern, Memories, PlayStage, WorldCrush } from "./scenes/scenesB";
import { AIGlitch, Cheer, Diagram, JapanLeak, LaptopCross, Lock, Target } from "./scenes/scenesC";
import { Bed, CrossRed, Cruel, Date_, Door, Finale, Love } from "./scenes/scenesD";

export type Scene = { id: string; start: number; end: number; r: (p: SP) => ReactNode };

// Every boundary below is the frame-detected start of a lyric line in the original video.
export const SCENES: Scene[] = [
  { id: "intro", start: 0, end: 2.8, r: (p) => <Intro {...p} /> },
  { id: "cell", start: 2.8, end: 13.3, r: (p) => <Cell {...p} /> },
  { id: "crush", start: 13.3, end: 15.65, r: (p) => <Crush {...p} /> },
  { id: "mask", start: 15.65, end: 20.65, r: (p) => <Mask {...p} /> },
  { id: "pulse", start: 20.65, end: 27.3, r: (p) => <Pulse {...p} /> },
  { id: "supper", start: 27.3, end: 33.15, r: (p) => <Supper {...p} /> },
  { id: "burn", start: 33.15, end: 36.5, r: (p) => <Burn {...p} /> },
  { id: "ember1", start: 36.5, end: 39.1, r: (p) => <Ember {...p} /> },

  { id: "play1", start: 39.1, end: 43.45, r: (p) => <PlayStage {...p} bg1="#76602a" bg2="#b48d38" c1={1.45} c2={2.55} /> },
  { id: "mem1", start: 43.45, end: 48.4, r: (p) => <Memories {...p} cue={1.45} bg="#4d3c19" /> },
  { id: "lantern", start: 48.4, end: 50.75, r: (p) => <Lantern {...p} /> },
  { id: "play2", start: 50.75, end: 55.15, r: (p) => <PlayStage {...p} bg1="#173c60" bg2="#2b6b8e" star c1={1.5} c2={2.55} /> },
  { id: "demon", start: 55.15, end: 56.85, r: (p) => <Demon {...p} /> },
  { id: "world", start: 56.85, end: 60.1, r: (p) => <WorldCrush {...p} /> },
  { id: "curtain", start: 60.1, end: 65.45, r: (p) => <Curtain {...p} /> },

  { id: "diagram", start: 65.45, end: 77.45, r: (p) => <Diagram {...p} /> },
  { id: "target", start: 77.45, end: 80.4, r: (p) => <Target {...p} /> },
  { id: "lock", start: 80.4, end: 82.05, r: (p) => <Lock {...p} /> },
  { id: "leak", start: 82.05, end: 84.25, r: (p) => <JapanLeak {...p} /> },
  { id: "cross", start: 84.25, end: 86.45, r: (p) => <LaptopCross {...p} /> },
  { id: "aiglitch", start: 86.45, end: 88.85, r: (p) => <AIGlitch {...p} /> },
  { id: "cheer", start: 88.85, end: 100.55, r: (p) => <Cheer {...p} /> },

  { id: "date", start: 100.55, end: 106.4, r: (p) => <Date_ {...p} /> },
  { id: "cruel", start: 106.4, end: 109.65, r: (p) => <Cruel {...p} /> },
  { id: "ember2", start: 109.65, end: 112.25, r: (p) => <Ember {...p} cross /> },

  { id: "play3", start: 112.25, end: 116.65, r: (p) => <PlayStage {...p} bg1="#5d5a29" bg2="#9a9444" c1={1.5} c2={2.55} conduct /> },
  { id: "mem2", start: 116.65, end: 121.55, r: (p) => <Memories {...p} cue={1.4} bg="#47392a" glow /> },
  { id: "bed1", start: 121.55, end: 123.9, r: (p) => <Bed {...p} mode="light" /> },
  { id: "red1", start: 123.9, end: 125.35, r: (p) => <CrossRed {...p} /> },
  { id: "bed2", start: 125.35, end: 126.45, r: (p) => <Bed {...p} mode="plain" /> },
  { id: "red2", start: 126.45, end: 128.25, r: (p) => <CrossRed {...p} big /> },
  { id: "bed3", start: 128.25, end: 129.95, r: (p) => <Bed {...p} mode="beam" /> },
  { id: "door", start: 129.95, end: 133.25, r: (p) => <Door {...p} /> },
  { id: "love", start: 133.25, end: 136.25, r: (p) => <Love {...p} /> },
  { id: "finale", start: 136.25, end: 149.5, r: (p) => <Finale {...p} /> },
];

export const SCENE_FADE = 0.12;
