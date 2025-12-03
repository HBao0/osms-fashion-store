FROM node:18-alpine AS builder
WORKDIR /app

# Install all dependencies (dev + prod)
COPY package.json package-lock.json* ./
RUN npm ci   # Bỏ --omit=dev

# Copy source and build
COPY . .
RUN npm run build

# Stage production
FROM node:18-alpine
WORKDIR /app

# Install only production dependencies
COPY package.json package-lock.json* ./
RUN npm ci --omit=dev

# Copy built files
COPY --from=builder /app/dist ./dist

ENV NODE_ENV=production
EXPOSE 3001
CMD ["node", "dist/server.js"]
