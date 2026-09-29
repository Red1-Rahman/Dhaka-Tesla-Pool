#!/usr/bin/env bash

set -e

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
BACKEND="$ROOT/backend"

cd "$BACKEND"

npm install
npx prisma generate
npx prisma migrate dev
npm run build
npm run start:dev