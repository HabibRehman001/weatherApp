# ── Stage 1: Build Angular frontend ──────────────────────────────────────────
FROM node:22-alpine AS frontend-builder

WORKDIR /app/frontend

COPY frontend/package*.json ./
RUN npm ci

COPY frontend/ ./
RUN node node_modules/@angular/cli/bin/ng.js build

# ── Stage 2: Compile backend + attach frontend dist ───────────────────────────
FROM node:22-alpine AS backend-builder

WORKDIR /app

COPY backend/package*.json ./
RUN npm ci

COPY backend/ ./
COPY --from=frontend-builder /app/frontend/dist/frontend/browser ./public

RUN npm run build

# ── Stage 3: Production image ─────────────────────────────────────────────────
FROM node:22-alpine AS production

WORKDIR /app

ENV NODE_ENV=production
ENV PORT=3000

COPY backend/package*.json ./
RUN npm ci --omit=dev

COPY --from=backend-builder /app/dist ./dist
COPY --from=backend-builder /app/public ./public

EXPOSE 3000

CMD ["node", "dist/index.js"]
