FROM node:22-alpine
WORKDIR /app
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY apps/api/package.json apps/api/package.json
COPY apps/web/package.json apps/web/package.json
COPY apps/user-web/package.json apps/user-web/package.json
RUN npm install --global pnpm@10.15.0 && pnpm install --no-frozen-lockfile
COPY . .
WORKDIR /app/apps/user-web
EXPOSE 5174
CMD ["pnpm","dev"]
