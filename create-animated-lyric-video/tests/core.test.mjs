import test from "node:test";
import assert from "node:assert/strict";
import { analyseLowBand } from "../server/audio.mjs";
import { ORIGINAL_DURATION, RESOLUTIONS, RequestError, validateManifest } from "../server/validation.mjs";

function fixture() {
  return {
    schemaVersion: 1, projectVersion: "build-a",
    project: {
      width: 1920, height: 1080, duration: ORIGINAL_DURATION, showEnglish: true,
      scenes: [{ id: "intro", start: 0, end: ORIGINAL_DURATION }],
      lyrics: [{ s: 2.8, e: 7.25, jp: "歌", en: "song" }],
    },
    settings: { resolution: "original", fps: 30, quality: "high" },
    audioTracks: [{ fileIndex: 0, kind: "music", start: 0, volume: 1 }],
  };
}
const files = [{ size: 2048, path: "/unused" }];

test("validates the complete uploaded animation and each export preset", () => {
  for (const [resolution, size] of Object.entries(RESOLUTIONS)) {
    for (const fps of [30, 60]) {
      const m = fixture(); m.settings.resolution = resolution; m.settings.fps = fps;
      const result = validateManifest(m, files, "build-a");
      assert.deepEqual(result.resolution, size);
      assert.equal(result.totalFrames, ORIGINAL_DURATION * fps);
    }
  }
});

test("rejects stale builds, bad settings, malformed timelines and missing audio", () => {
  const check = (change, expected) => { const m = fixture(); change(m); assert.throws(() => validateManifest(m, files, "build-a"), expected || RequestError); };
  check((m) => { m.projectVersion = "old"; }, /different project version/);
  check((m) => { m.settings.resolution = "__proto__"; });
  check((m) => { m.settings.fps = 24; });
  check((m) => { m.project.scenes[0].end = 10; });
  check((m) => { m.project.duration = 0.5; });
  check((m) => { m.project.lyrics[0].jp = ""; });
  check((m) => { m.audioTracks[0].start = -1; });
  check((m) => { m.audioTracks[0].volume = 99; });
  assert.throws(() => validateManifest(fixture(), [], "build-a"), /soundtrack audio/);
});

test("supports bounded multi-track music, effects and voice timing", () => {
  const m = fixture();
  m.audioTracks.push({ fileIndex: 1, kind: "voice", start: 20.1, volume: 0.75 });
  m.audioTracks.push({ fileIndex: 2, kind: "sound", start: 50, volume: 0.5 });
  const result = validateManifest(m, [...files, ...files, ...files], "build-a");
  assert.equal(result.audioTracks.length, 3);
  m.audioTracks[2].fileIndex = 1;
  assert.throws(() => validateManifest(m, [...files, ...files, ...files], "build-a"), /audio track/);
});

test("audio analysis is deterministic, audio-reactive and silent after the track", () => {
  const silence = new Float32Array(48000);
  assert.ok(analyseLowBand(silence, 1).every((n) => n === 0));
  const tone = Float32Array.from({ length: 48000 }, (_, i) => 0.4 * Math.sin(2 * Math.PI * 750 * i / 48000));
  const energy = analyseLowBand(tone, 2);
  assert.equal(energy.length, 120);
  assert.equal(energy[0], 0);
  assert.ok(energy[30] > 0.2, "music must affect scene energy");
  assert.ok(energy[110] < 0.001, "energy must decay after audio ends");
  assert.deepEqual(energy, analyseLowBand(tone, 2));
});
