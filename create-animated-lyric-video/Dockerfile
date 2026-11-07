# Keep the Playwright package and browser image versions in sync.
FROM mcr.microsoft.com/playwright:v1.56.1-noble AS build
WORKDIR /app
ENV PLAYWRIGHT_SKIP_BROWSER_DOWNLOAD=1
COPY package.json package-lock.json ./
RUN npm ci --no-audit --no-fund
COPY index.html tsconfig.json vite.config.ts ./
COPY src ./src
COPY server ./server
COPY public ./public
RUN npm run build

FROM mcr.microsoft.com/playwright:v1.56.1-noble AS runtime
ENV DEBIAN_FRONTEND=noninteractive
RUN apt-get update && apt-get install -y --no-install-recommends ffmpeg fonts-noto-cjk \
    && rm -rf /var/lib/apt/lists/*
WORKDIR /app
COPY --from=build --chown=pwuser:pwuser /app/package.json ./package.json
COPY --from=build --chown=pwuser:pwuser /app/node_modules ./node_modules
COPY --from=build --chown=pwuser:pwuser /app/dist ./dist
COPY --from=build --chown=pwuser:pwuser /app/server ./server
USER pwuser
ENV NODE_ENV=production HOST=0.0.0.0 PORT=8080 RENDER_STORAGE_DIR=/tmp/playback-renders
EXPOSE 8080
HEALTHCHECK --interval=30s --timeout=5s --start-period=30s --retries=3 \
  CMD node -e "fetch('http://127.0.0.1:'+(process.env.PORT||8080)+'/api/health').then(async r=>process.exit(r.ok&&(await r.json()).ready?0:1)).catch(()=>process.exit(1))"
CMD ["node", "server/index.mjs"]
