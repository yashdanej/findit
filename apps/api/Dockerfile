FROM node:22

WORKDIR /app

RUN npm install --global pnpm@10.15.0

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY apps/api/package.json apps/api/package.json
COPY apps/web/package.json apps/web/package.json
COPY apps/user-web/package.json apps/user-web/package.json

RUN pnpm install --no-frozen-lockfile

COPY . .

WORKDIR /app/apps/api

EXPOSE 5000

CMD ["pnpm", "dev"]