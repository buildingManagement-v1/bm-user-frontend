# Build stage
FROM node:20-alpine AS builder

WORKDIR /app

COPY package.json package-lock.json* ./
RUN npm ci || npm install

COPY . .
RUN npm run build

# Production stage
FROM node:20-alpine AS runner

WORKDIR /app

ENV NODE_ENV=production
ENV HOST=0.0.0.0
ENV PORT=3001
ENV NITRO_HOST=0.0.0.0
ENV NITRO_PORT=3001

COPY --from=builder /app/.output ./.output
COPY --from=builder /app/package.json ./

EXPOSE 3001

CMD ["node", ".output/server/index.mjs"]
