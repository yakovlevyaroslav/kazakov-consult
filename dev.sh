#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "$0")" && pwd)"
cd "$ROOT_DIR"

if [ ! -f ".env" ]; then
  echo "⚠️  Файл .env не найден. Скопируйте .env.example в .env и заполните переменные."
fi

cleanup() {
  echo ""
  echo "Останавливаю процессы..."
  if [ -n "${API_PID:-}" ] && kill -0 "$API_PID" 2>/dev/null; then
    kill "$API_PID" 2>/dev/null || true
  fi
  if [ -n "${WEB_PID:-}" ] && kill -0 "$WEB_PID" 2>/dev/null; then
    kill "$WEB_PID" 2>/dev/null || true
  fi
  wait 2>/dev/null || true
}

trap cleanup INT TERM EXIT

echo "Запускаю API (http://localhost:3000)..."
npm run start:api &
API_PID=$!

echo "Запускаю Webpack dev server (http://localhost:8080)..."
npm start &
WEB_PID=$!

echo ""
echo "Dev-режим запущен:"
echo "- Фронт: http://localhost:8080"
echo "- API:   http://localhost:3000"
echo "Для остановки нажмите Ctrl+C"

wait
