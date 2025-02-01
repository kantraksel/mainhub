# syntax=docker/dockerfile:1
FROM node:18-alpine

# dependencies
RUN apk add --no-cache git
RUN npm install -g pnpm

USER node
WORKDIR /home/node
ENV NODE_ENV=production

# download node deps
COPY package.json pnpm-lock.yaml ./
RUN pnpm install --frozen-lockfile

# download react deps
WORKDIR html/react
COPY package.json pnpm-lock.yaml ./
RUN pnpm install --frozen-lockfile
WORKDIR /home/node

# copy app files; must contain bundled files
COPY . .

# .env must be supplied by KEYS_FILE env var
ENTRYPOINT [ "node", "binary/app.js" ]
