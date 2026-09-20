#!/usr/bin/env bash
# Runs on the Google VM. Pulls GitHub and rebuilds containers.
# .env.prod is copied from /tmp (GitHub secret) and never stored in Git.
set -euo pipefail

REPO_URL="https://github.com/cristiancacereslabrador/ValleCaroInmobiliaria.git"
BRANCH="${DEPLOY_BRANCH:-inmob-2026}"
APP_DIR="/home/cristiancacereslabrador/inmob"

sudo -- mkdir -p "${APP_DIR}"

if sudo -- test ! -d "${APP_DIR}/.git"; then
  sudo -- rm -rf /tmp/inmob-src
  sudo -- git clone --branch "${BRANCH}" "${REPO_URL}" /tmp/inmob-src \
    || sudo -- git clone "${REPO_URL}" /tmp/inmob-src
  sudo -- cp -a /tmp/inmob-src/. "${APP_DIR}/"
else
  sudo -- git -C "${APP_DIR}" remote set-url origin "${REPO_URL}"
  sudo -- git -C "${APP_DIR}" fetch origin
  if sudo -- git -C "${APP_DIR}" rev-parse --verify "origin/${BRANCH}" >/dev/null 2>&1; then
    sudo -- git -C "${APP_DIR}" checkout -B "${BRANCH}" "origin/${BRANCH}"
    sudo -- git -C "${APP_DIR}" reset --hard "origin/${BRANCH}"
  else
    sudo -- git -C "${APP_DIR}" checkout -B main origin/main
    sudo -- git -C "${APP_DIR}" reset --hard origin/main
  fi
fi

if [[ -f /tmp/inmob.env.prod ]]; then
  sudo -- cp /tmp/inmob.env.prod "${APP_DIR}/.env.prod"
fi

if sudo -- test ! -f "${APP_DIR}/.env.prod"; then
  echo "Falta ${APP_DIR}/.env.prod en el servidor."
  exit 1
fi

sudo -- bash -c "cd '${APP_DIR}' && docker compose -f docker-compose.prod.yml --env-file .env.prod up -d --build"
echo "Deploy OK $(date -u +%Y-%m-%dT%H:%M:%SZ)"
