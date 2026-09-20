#!/usr/bin/env bash
# Runs on the Google VM. Pulls GitHub and rebuilds containers.
# .env.prod stays on the server and is never taken from Git.
set -euo pipefail

REPO_URL="https://github.com/cristiancacereslabrador/ValleCaroInmobiliaria.git"
BRANCH="${DEPLOY_BRANCH:-inmob-2026}"
APP_DIR="${HOME}/inmob"
COMPOSE="docker compose -f docker-compose.prod.yml --env-file .env.prod"

if [[ -f "${APP_DIR}/.env.prod" ]]; then
  cp "${APP_DIR}/.env.prod" /tmp/inmob.env.prod
fi

if [[ ! -d "${APP_DIR}/.git" ]]; then
  mkdir -p "${HOME}"
  rm -rf "${APP_DIR}"
  git clone --branch "${BRANCH}" "${REPO_URL}" "${APP_DIR}" \
    || git clone "${REPO_URL}" "${APP_DIR}"
fi

cd "${APP_DIR}"
git remote set-url origin "${REPO_URL}"
git fetch origin
if git rev-parse --verify "origin/${BRANCH}" >/dev/null 2>&1; then
  git checkout -B "${BRANCH}" "origin/${BRANCH}"
  git reset --hard "origin/${BRANCH}"
else
  git checkout -B main origin/main
  git reset --hard origin/main
fi

if [[ -f /tmp/inmob.env.prod ]]; then
  cp /tmp/inmob.env.prod "${APP_DIR}/.env.prod"
fi

if [[ ! -f "${APP_DIR}/.env.prod" ]]; then
  echo "Falta ${APP_DIR}/.env.prod en el servidor."
  exit 1
fi

export DEBIAN_FRONTEND=noninteractive
sudo -- ${COMPOSE} up -d --build
echo "Deploy OK $(date -u +%Y-%m-%dT%H:%M:%SZ)"
