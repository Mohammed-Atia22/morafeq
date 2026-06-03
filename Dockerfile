# ─── Stage 1: Build ───────────────────────────
FROM node:20-alpine AS builder

WORKDIR /app

COPY Backend/package*.json ./
COPY Backend/prisma ./prisma/

RUN npm install

COPY Backend/ .

RUN npx prisma generate

RUN npm run build

# ─── Stage 2: Production ──────────────────────
FROM node:20-alpine AS runner

WORKDIR /app

# Install OpenSSL 3 — required by Prisma on Alpine Linux
RUN apk add --no-cache openssl3

COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/package*.json ./

EXPOSE 3001

CMD ["node", "dist/src/main"]