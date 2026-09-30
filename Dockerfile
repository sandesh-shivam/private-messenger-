# Stage 1: Build Frontend
FROM node:20-alpine AS builder
WORKDIR /app

COPY package*.json ./
COPY client/package*.json ./client/
COPY server/package*.json ./server/

RUN npm ci

COPY client/ ./client/
COPY server/ ./server/

RUN npm run build --workspace client

# Stage 2: Production Runtime
FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production

COPY package*.json ./
COPY server/package*.json ./server/

RUN npm ci --omit=dev --workspace server

COPY server/ ./server/
COPY --from=builder /app/client/dist ./client/dist

# Persistent data directory
VOLUME ["/app/server/data"]
ENV DATA_FILE_PATH=/app/server/data/data.json
ENV PORT=4000

EXPOSE 4000

# Run as non-root user
USER node

WORKDIR /app/server
CMD ["node", "index.js"]
