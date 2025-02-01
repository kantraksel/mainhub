#!/bin/sh

pnpm install --frozen-lockfile
pnpm build

pushd html/react
pnpm install --frozen-lockfile
pnpm build
