import { useLayoutEffect, useState } from "react";
import { flushSync } from "react-dom";
import { FilmStage } from "./Film";
import { PROJECT_VERSION, type ProjectSnapshot } from "./project";
import { SCENES } from "./timeline";

type ExportRenderer = {
  version: string;
  load: (snapshot: ProjectSnapshot) => void;
  frame: (time: number, energy: number) => Promise<void>;
};

declare global {
  interface Window { __EXPORT_RENDERER__?: ExportRenderer }
}

/** Only opened by the server's Chromium. There is no clock or video encoder here. */
export default function RenderApp() {
  const [snapshot, setSnapshot] = useState<ProjectSnapshot | null>(null);
  const [frame, setFrame] = useState({ t: 0, e: 0 });

  useLayoutEffect(() => {
    const supportedScenes = new Set(SCENES.map((s) => s.id));
    const api: ExportRenderer = {
      version: PROJECT_VERSION,
      load(project) {
        if (project.scenes.some((scene) => !supportedScenes.has(scene.id))) {
          throw new Error("This renderer does not support one of the uploaded scenes.");
        }
        flushSync(() => setSnapshot(project));
      },
      async frame(t, e) {
        flushSync(() => setFrame({ t, e }));
        // Force layout so newly used font subsets start loading before we wait.
        document.documentElement.getBoundingClientRect();
        await document.fonts.ready;
        await new Promise<void>((resolve) => requestAnimationFrame(() => resolve()));
      },
    };
    window.__EXPORT_RENDERER__ = api;
    return () => { if (window.__EXPORT_RENDERER__ === api) delete window.__EXPORT_RENDERER__; };
  }, []);

  return (
    <div className="relative h-full w-full overflow-hidden bg-black">
      {snapshot && <FilmStage t={frame.t} e={frame.e} started snapshot={snapshot} width={window.innerWidth} height={window.innerHeight} rendering />}
    </div>
  );
}
