#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "$0")" && pwd)"
cd "$ROOT_DIR"

if [ ! -f ".env" ]; then
  echo "⚠️  Файл .env не найден. Скопируйте .env.example в .env и заполните переменные."
  exit 1
fi

echo "Собираю production-бандл..."
npm run build

echo "Запускаю production-сервер на http://localhost:${PORT:-3000} ..."
exec npm run start:api
