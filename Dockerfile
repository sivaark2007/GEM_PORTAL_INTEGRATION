# ── Stage 1: Build the React frontend ────────────────────────────────────────
FROM node:20-alpine AS builder

WORKDIR /app

# Copy package files first (Docker cache optimization)
COPY package.json package-lock.json ./

# Install all Node.js dependencies (including devDependencies for build)
RUN npm ci

# Copy all source files
COPY . .

# Build the React app for production (outputs to /app/dist)
RUN npm run build

# ── Stage 2: Production runtime (Express server + built frontend) ─────────────
FROM node:20-alpine AS runner

WORKDIR /app

# Copy package files
COPY package.json package-lock.json ./

# Install only production dependencies (no devDeps like tsx, typescript, etc.)
RUN npm ci --omit=dev

# Copy the Express server source
COPY server.ts ./
COPY tsconfig.json ./

# Install tsx globally to run the TypeScript server directly
RUN npm install -g tsx

# Copy the built React frontend from Stage 1
COPY --from=builder /app/dist ./dist

# Expose port 5000 (Express API) — Vite frontend is served statically by Express
EXPOSE 5000

# Start the Express server (which serves both the API and the built React app)
CMD ["tsx", "server.ts"]
