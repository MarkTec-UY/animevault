#!/bin/sh
set -eu

cd /app

if [ ! -f .env.local ] && [ -f .env.example ]; then
  cp .env.example .env.local
fi

needs_install="false"

if [ ! -d node_modules ] || [ -z "$(ls -A node_modules 2>/dev/null)" ]; then
  needs_install="true"
fi

if [ "${needs_install}" = "false" ] && ! find node_modules/.pnpm -maxdepth 1 -name '@next+swc-linux-x64-gnu@*' | grep -q . 2>/dev/null; then
  needs_install="true"
fi

if [ "${needs_install}" = "true" ]; then
  pnpm install --frozen-lockfile
fi

exec "$@"
