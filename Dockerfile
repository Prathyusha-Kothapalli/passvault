# PassVault Multi-Stage Production Dockerfile

FROM node:22-alpine AS builder
WORKDIR /app

# Copy dependency manifests
COPY package*.json ./
RUN npm ci --only=production

# Copy application source
COPY . .

FROM node:22-alpine
WORKDIR /app

# Install Python 3 for security utilities
RUN apk add --no-cache python3 py3-pip

COPY --from=builder /app /app

ENV PORT=3000
ENV NODE_ENV=production

EXPOSE 3000

HEALTHCHECK --interval=30s --timeout=5s --start-period=5s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:3000/api/health || exit 1

CMD ["node", "server/index.js"]
