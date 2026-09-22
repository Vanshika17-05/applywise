FROM node:22-alpine
WORKDIR /app
RUN corepack enable
COPY package.json pnpm-workspace.yaml pnpm-lock.yaml ./
COPY client/package.json ./client/package.json
COPY server/package.json ./server/package.json
RUN pnpm install --frozen-lockfile --filter @applywise/client...
COPY client ./client
WORKDIR /app/client
EXPOSE 5173
CMD ["pnpm", "dev"]
