import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";
import { viteSingleFile } from "vite-plugin-singlefile";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Refuse a render when the uploading app and the server were built from different
// project source. The server never executes code supplied by a client.
function projectVersion() {
  const hash = crypto.createHash("sha256");
  const walk = (dir: string) => {
    for (const entry of fs.readdirSync(dir, { withFileTypes: true }).sort((a, b) => a.name.localeCompare(b.name))) {
      const file = path.join(dir, entry.name);
      if (entry.isDirectory()) walk(file);
      else if (/\.(tsx?|css)$/.test(entry.name)) {
        hash.update(path.relative(__dirname, file).replace(/\\/g, "/"));
        hash.update(fs.readFileSync(file));
      }
    }
  };
  walk(path.join(__dirname, "src"));
  hash.update(fs.readFileSync(path.join(__dirname, "index.html")));
  hash.update(fs.readFileSync(path.join(__dirname, "package-lock.json")));
  return hash.digest("hex").slice(0, 24);
}
const version = projectVersion();

export default defineConfig({
  define: { __PROJECT_VERSION__: JSON.stringify(version) },
  plugins: [
    react(), tailwindcss(), viteSingleFile(),
    {
      name: "playback-render-version",
      generateBundle() {
        this.emitFile({ type: "asset", fileName: "render-version.json", source: JSON.stringify({ version }) });
      },
    },
  ],
  resolve: { alias: { "@": path.resolve(__dirname, "src") } },
  server: {
    host: "0.0.0.0",
    allowedHosts: true,
    // This is a server-side proxy; the user's browser only makes same-origin requests.
    proxy: { "/api": { target: process.env.RENDER_PROXY_TARGET || "http://127.0.0.1:3001" } },
  },
});
