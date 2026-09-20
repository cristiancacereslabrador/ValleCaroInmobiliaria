#!/usr/bin/env bash
# Runs on the Google VM. Pulls GitHub and rebuilds containers.
# .env.prod stays on the server and is never taken from Git.
set -euo pipefail

REPO_URL="https://github.com/cristiancacereslabrador/ValleCaroInmobiliaria.git"
BRANCH="${DEPLOY_BRANCH:-inmob-2026}"
APP_DIR="/home/cristiancacereslabrador/inmob"

if [[ -f "${APP_DIR}/.env.prod" ]]; then
  sudo -- cp "${APP_DIR}/.env.prod" /tmp/inmob.env.prod
fi

if [[ ! -d "${APP_DIR}/.git" ]]; then
  sudo -- rm -rf "${APP_DIR}"
  sudo -- git clone --branch "${BRANCH}" "${REPO_URL}" "${APP_DIR}" \
    || sudo -- git clone "${REPO_URL}" "${APP_DIR}"
fi

sudo -- git -C "${APP_DIR}" remote set-url origin "${REPO_URL}"
sudo -- git -C "${APP_DIR}" fetch origin
if sudo -- git -C "${APP_DIR}" rev-parse --verify "origin/${BRANCH}" >/dev/null 2>&1; then
  sudo -- git -C "${APP_DIR}" checkout -B "${BRANCH}" "origin/${BRANCH}"
  sudo -- git -C "${APP_DIR}" reset --hard "origin/${BRANCH}"
else
  sudo -- git -C "${APP_DIR}" checkout -B main origin/main
  sudo -- git -C "${APP_DIR}" reset --hard origin/main
fi

if [[ -f /tmp/inmob.env.prod ]]; then
  sudo -- cp /tmp/inmob.env.prod "${APP_DIR}/.env.prod"
fi

if [[ ! -f "${APP_DIR}/.env.prod" ]]; then
  echo "Falta ${APP_DIR}/.env.prod en el servidor."
  exit 1
fi

sudo -- bash -c "cd '${APP_DIR}' && docker compose -f docker-compose.prod.yml --env-file .env.prod up -d --build"
echo "Deploy OK $(date -u +%Y-%m-%dT%H:%M:%SZ)"
