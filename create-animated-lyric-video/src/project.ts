import { DURATION } from "./lib";
import { LYRICS, type Line } from "./lyrics";
import { SCENES } from "./timeline";

declare const __PROJECT_VERSION__: string;

export const PROJECT_VERSION = __PROJECT_VERSION__;
export type SceneSnapshot = { id: string; start: number; end: number };
export type ProjectSnapshot = {
  width: 1920;
  height: 1080;
  duration: number;
  scenes: SceneSnapshot[];
  lyrics: Line[];
  showEnglish: boolean;
};

// Only data is uploaded; rendering code is the matching, trusted server build.
export function makeProjectSnapshot(showEnglish: boolean): ProjectSnapshot {
  return {
    width: 1920,
    height: 1080,
    duration: DURATION,
    scenes: SCENES.map(({ id, start, end }) => ({ id, start, end })),
    lyrics: LYRICS,
    showEnglish,
  };
}
