# ─── Stage 1: Build ───────────────────────────
FROM node:20-alpine AS builder

WORKDIR /app

# Copy package files first (better caching)
COPY package*.json ./
COPY prisma ./prisma/

# Install all dependencies
RUN npm install

# Copy source code
COPY . .

# Generate Prisma client
RUN npx prisma generate

# Build the NestJS app
RUN npm run build

# ─── Stage 2: Production ──────────────────────
FROM node:20-alpine AS runner

WORKDIR /app

# Copy only what is needed to run
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/package*.json ./

# Expose the port the app runs on
EXPOSE 3001

# Start the app
CMD ["node", "dist/main"]