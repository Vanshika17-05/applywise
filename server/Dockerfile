FROM node:22-alpine
WORKDIR /app
RUN corepack enable
COPY package.json pnpm-workspace.yaml pnpm-lock.yaml ./
COPY server/package.json ./server/package.json
COPY client/package.json ./client/package.json
RUN pnpm install --frozen-lockfile --filter @applywise/server... --prod
COPY server/src ./server/src
WORKDIR /app/server
ENV NODE_ENV=production
EXPOSE 4000
CMD ["node", "src/index.js"]
