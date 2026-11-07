# Playback lyric film — cloud MP4 export

The existing film is a 1920×1080 React/SVG animation, 149.5 seconds long. Its **Export MP4** control uploads a snapshot of the timeline, lyrics and audio to a Node.js render service. A headless Chromium instance on that service renders the same scene components at exact frame times; FFmpeg encodes the PNG frames and synchronized audio as H.264 (`yuv420p`) and AAC in an MP4. No `MediaRecorder`, FFmpeg.wasm, or client-side video rendering is used.

## Important: the soundtrack is missing from this repository

The original code references `src/assets/playback.mp3`, but that file was not committed. Obtain the original audio separately and select it in the player or export dialog. The upload must contain the music, effects and voices that should be heard; the service cannot reconstruct a missing soundtrack. Only upload audio you are authorized to use. Alternatively, an operator may put it at `public/assets/playback.mp3` **before building**. That file is intentionally ignored by Git.

The song is mixed from time zero; if it ends before the 149.5-second film, the remaining outro is silent, as in the player. The service also supports multiple uploaded audio tracks with individual start times and gains in its manifest. The current player has a single soundtrack, so the UI uploads that one track. Muting the player does not mute the export.

## Exporting

1. Deploy the service below, and open its HTTPS URL (or configure a separately hosted frontend).
2. Choose the original soundtrack, then select **Export MP4**. It is available on the opening screen and in the player controls.
3. Choose original/1080p/1440p/4K, 30/60 FPS and standard/high quality. Original and 1080p are both 1920×1080. The original player uses an audio-locked `requestAnimationFrame` clock rather than a fixed source FPS, so the selected FPS determines the number of frames captured.
4. Start the cloud render. Status, actual captured-frame progress, an estimated remaining capture time and queue position are shown. Final encoding has its own status. You can close the dialog or refresh the same browser; it remembers the job.
5. Download the MP4 before it expires. A completed download deletes the server copy; an interrupted download can be retried until expiration.

Higher resolutions, 60 FPS and high quality require substantially more server CPU, memory, disk space and time. Encoding begins while frames are being captured; the time estimate is approximate and final MP4 processing may take additional time.

## Deploy to Fly.io

The `Dockerfile` contains the complete frontend and backend, Playwright's matching Chromium, FFmpeg, and Japanese font fallbacks. The same container serves the app and its `/api` endpoints, so this is the simplest deployment and does not depend on Google AI Studio hosting Node processes.

1. Install [Flyctl](https://fly.io/docs/flyctl/install/) and sign in to Fly.io. Create/select an organization and billing plan suitable for a long-running CPU-intensive machine.
2. From this directory, copy `fly.toml.example` to `fly.toml`; set `app` to a globally unique name and choose a region. The example reserves one 4-vCPU/8-GB machine and disables automatic stopping so a render can finish. Provision more CPU/RAM and sufficient temporary disk for 4K if needed; monitor storage and cost.
3. Run:

   ```sh
   fly apps create YOUR-UNIQUE-APP-NAME
   fly deploy
   fly scale count 1
   fly status
   ```

4. Open `https://YOUR-UNIQUE-APP-NAME.fly.dev`, select the soundtrack, and export. Check `https://YOUR-UNIQUE-APP-NAME.fly.dev/api/health`; a healthy, ready service returns HTTP 200 with `ready: true`.

**Use exactly one service instance** with this implementation. Jobs are an in-memory queue and files are on that instance's temporary disk; multiple load-balanced instances would not share job state. A restart/deploy interrupts jobs and removes leftover files. For multi-instance or durable production use, replace the in-memory queue/local storage with a shared job queue and object storage, and use authenticated access controls.

The sample is not a public multi-tenant service: the API has no user login. A random, unguessable job ID acts as a bearer capability for its status/download/cancel endpoints; anyone with that ID can access the job. Before exposing it to untrusted users, put an authenticated gateway in front of **both the frontend and API**, enforce per-user quotas/rate limits, isolate the worker, limit network egress, and monitor CPU, memory and disk. Origin checks and queue limits are not authentication. The container runs as non-root and accepts data, not client-supplied HTML, JavaScript, URLs or shell commands. Chromium's OS sandbox is disabled by default for container compatibility; set `CHROMIUM_SANDBOX=1` only with a host/container security profile that supports Chromium's sandbox. Do not put unrelated secrets or private files in a render worker.

### Separately hosted frontend / AI Studio

If the preview cannot host Node, deploy the container as above. Build the frontend from **the same commit and lockfile** as the server, setting the HTTPS renderer URL at build time:

```sh
VITE_RENDER_API_URL=https://YOUR-UNIQUE-APP-NAME.fly.dev npm run build
```

Host `dist/index.html` as the frontend. Set `ALLOWED_ORIGINS` on the rendering service to the frontend's exact origin(s), comma-separated. For Fly.io, for example:

```sh
fly secrets set ALLOWED_ORIGINS=https://example.com,https://preview.example.com
```

The service must restart after changing the setting. AI Studio preview origins can change, so add the actual current preview origin. The browser uploads directly to this HTTPS service; it never calls a backend on the viewer's localhost. The service rejects a mismatched frontend build rather than silently rendering an older animation. Authenticated cross-origin deployments also need a gateway that handles CORS/preflight and cookies permitted in that embedding context; browser third-party-cookie restrictions may require a same-origin proxy. Serving both parts from the same origin avoids CORS configuration entirely.

## Configuration

| Environment variable | Default | Purpose |
| --- | --- | --- |
| `HOST`, `PORT` | `0.0.0.0`, `3001` (`8080` in Docker) | Service listener. |
| `ALLOWED_ORIGINS` | empty | Exact additional frontend origins; same-host requests are allowed. Not an access-control substitute. |
| `TRUST_PROXY` | `0` | Set to `1` only behind a trusted reverse proxy that sets `X-Forwarded-Host` (the Fly example does). |
| `MAX_RUNNING_JOBS`, `MAX_QUEUED_JOBS` | `1`, `2` | Per-instance CPU/memory and queue limits. |
| `MAX_UPLOAD_MB` | `80` | Total uploaded audio limit. |
| `RENDER_TTL_MINUTES` | `60` | Retention after completion, failure or cancellation. |
| `RENDER_TTL_SECONDS` | unset | Optional shorter TTL in seconds; overrides minutes. |
| `RENDER_TIMEOUT_MINUTES` | `480` | Maximum running time before a render is aborted. |
| `RENDER_STORAGE_DIR` | `/tmp/playback-renders` | Private temporary directory dedicated to **one** service instance. |
| `FFMPEG_PATH`, `FFPROBE_PATH` | `ffmpeg`, `ffprobe` on `PATH` | Optional binary locations. FFmpeg must include `libx264` and AAC. |
| `CHROMIUM_EXECUTABLE_PATH` | Playwright's installed Chromium | Optional Chromium binary override. |
| `CHROMIUM_SANDBOX` | `0` | Set to `1` only with a compatible sandbox configuration. |

Uploaded inputs and the intermediate audio mix are removed after encoding; failed or cancelled jobs are cleaned immediately. The final MP4 is deleted after a successful download or automatically after the TTL. Stale job directories are removed at service startup. No database, cloud storage bucket or long-term retention is configured.

## Development and tests

Node 22, FFmpeg/FFprobe with `libx264` and AAC, and the Playwright Chromium matching `playwright` in `package.json` are required. For a developer-only local smoke test:

```sh
npm ci
npx playwright install --with-deps chromium
npm run build
npm run render:serve   # serves the built app and API at http://localhost:3001
```

This local service is for development only; deploy it remotely for users. For Vite development, run `npm run dev` separately; its server-side `/api` proxy targets port 3001. Rebuild and restart both processes after changing source so the renderer and frontend version hashes match. `VITE_RENDER_API_URL` overrides the relative API URL for a remote service.

```sh
npm run typecheck
npm test
```

The integration test runs only if a built app and working FFmpeg, FFprobe and Chromium are available. It generates synthetic audio, captures real Chromium frames, probes H.264/AAC output at both frame rates and all resolution presets, checks audio timing, representative frames across every scene and transition, cancellation and cleanup. It never needs the copyrighted soundtrack. Set the binary path environment variables above if the programs are not on their usual paths. The test-only short-duration/small-resolution mode is enabled only in its isolated child server; do not set `RENDER_TEST_MODE` in deployment.
