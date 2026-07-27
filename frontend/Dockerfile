FROM node:24-alpine AS base

RUN corepack enable && corepack prepare pnpm@11.17.0 --activate
WORKDIR /app
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml .npmrc ./
RUN pnpm install --frozen-lockfile

FROM base AS dev
COPY . .
EXPOSE 5173
CMD ["pnpm", "exec", "vite", "dev", "--host", "0.0.0.0", "--port", "5173"]

FROM base AS builder
COPY . .
RUN pnpm build

FROM node:24-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production HOST=0.0.0.0 PORT=5173
COPY --from=builder /app/build ./build
COPY --from=builder /app/package.json ./package.json
EXPOSE 5173
USER node
CMD ["node", "build"]
