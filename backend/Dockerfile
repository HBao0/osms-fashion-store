FROM node:18-alpine AS builder
WORKDIR /app

# Install build deps
COPY package.json package-lock.json* ./
RUN npm ci --omit=dev || npm install

# Copy source and build
COPY . .
RUN npm run build

FROM node:18-alpine
WORKDIR /app

# Production dependencies
COPY package.json package-lock.json* ./
RUN npm ci --omit=dev || npm install --only=prod

# Copy built files
COPY --from=builder /app/dist ./dist

ENV NODE_ENV=production
EXPOSE 3001
CMD ["node", "dist/server.js"]
