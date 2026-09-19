FROM node:20-bookworm-slim AS build
WORKDIR /app
COPY package.json package-lock.json ./
COPY apps/api/package.json apps/api/package.json
COPY apps/web/package.json apps/web/package.json
RUN npm ci --workspace=apps/api --include-workspace-root
COPY apps/api apps/api
RUN npm run build --workspace=apps/api

FROM node:20-bookworm-slim
WORKDIR /app
ENV NODE_ENV=production
COPY package.json package-lock.json ./
COPY apps/api/package.json apps/api/package.json
COPY apps/web/package.json apps/web/package.json
RUN npm ci --workspace=apps/api --omit=dev --include-workspace-root
COPY --from=build /app/apps/api/dist apps/api/dist
COPY apps/api/src/database/migrations apps/api/src/database/migrations
WORKDIR /app/apps/api
EXPOSE 3001
CMD ["node", "dist/main.js"]
