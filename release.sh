#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "$0")" && pwd)"
cd "$ROOT_DIR"

RELEASE_BRANCH="${RELEASE_BRANCH:-}"
RELEASE_HEALTHCHECK_URL="${RELEASE_HEALTHCHECK_URL:-https://kazakov-consult.ru}"
RELEASE_SKIP_PULL="${RELEASE_SKIP_PULL:-0}"
RELEASE_SKIP_INSTALL="${RELEASE_SKIP_INSTALL:-0}"
RELEASE_SKIP_BUILD="${RELEASE_SKIP_BUILD:-0}"

usage() {
  cat <<'EOF'
Usage:
  ./release.sh [options]

Options:
  --branch <value>       Проверить, что релиз из этой ветки
  --health <url>         URL for post-deploy health check
  --skip-pull            Не делать git pull
  --skip-install         Не делать npm ci
  --skip-build           Не делать npm run build
  -h, --help             Show this help

Run this script directly on VPS inside project directory.
EOF
}

while (($#)); do
  case "$1" in
    --branch) RELEASE_BRANCH="${2:-}"; shift 2 ;;
    --health) RELEASE_HEALTHCHECK_URL="${2:-}"; shift 2 ;;
    --skip-pull) RELEASE_SKIP_PULL="1"; shift ;;
    --skip-install) RELEASE_SKIP_INSTALL="1"; shift ;;
    --skip-build) RELEASE_SKIP_BUILD="1"; shift ;;
    -h|--help) usage; exit 0 ;;
    *) echo "Unknown option: $1"; usage; exit 1 ;;
  esac
done

if [[ ! -d ".git" ]]; then
  echo "Ошибка: release.sh нужно запускать в git-репозитории на сервере."
  exit 1
fi

if [[ ! -f ".env" ]]; then
  echo "Ошибка: отсутствует .env в ${ROOT_DIR}."
  exit 1
fi

if [[ -n "$RELEASE_BRANCH" ]]; then
  CURRENT_BRANCH="$(git rev-parse --abbrev-ref HEAD)"
  if [[ "$CURRENT_BRANCH" != "$RELEASE_BRANCH" ]]; then
    echo "Ошибка: текущая ветка '$CURRENT_BRANCH', ожидается '$RELEASE_BRANCH'."
    exit 1
  fi
fi

if [[ "$RELEASE_SKIP_PULL" != "1" ]]; then
  echo "==> Обновление кода из git"
  git fetch --all --prune
  git pull --ff-only
fi

if [[ "$RELEASE_SKIP_INSTALL" != "1" ]]; then
  echo "==> Установка зависимостей"
  npm ci
fi

if [[ "$RELEASE_SKIP_BUILD" != "1" ]]; then
  echo "==> Сборка production"
  npm run build
fi

echo "==> Перезапуск PM2"
pm2 restart kazakov || pm2 start ./prod.sh --name kazakov
pm2 save
pm2 status

echo "==> Health check: ${RELEASE_HEALTHCHECK_URL}"
HEALTH_RETRIES=12
HEALTH_DELAY_SEC=5
HEALTH_OK=0

for ((i=1; i<=HEALTH_RETRIES; i++)); do
  if curl -fsSIL "${RELEASE_HEALTHCHECK_URL}" >/dev/null; then
    HEALTH_OK=1
    break
  fi
  echo "  попытка ${i}/${HEALTH_RETRIES} неуспешна, жду ${HEALTH_DELAY_SEC}с..."
  sleep "${HEALTH_DELAY_SEC}"
done

if [[ "${HEALTH_OK}" -ne 1 ]]; then
  echo "❌ Health-check не прошёл: ${RELEASE_HEALTHCHECK_URL}"
  echo "Последний статус PM2:"
  pm2 status || true
  echo "Последние логи PM2 (kazakov):"
  pm2 logs kazakov --lines 60 --nostream || true
  exit 1
fi

echo "✅ Релиз завершён успешно"
