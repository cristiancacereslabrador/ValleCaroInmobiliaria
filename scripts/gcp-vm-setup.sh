#!/usr/bin/env bash
# Run on the Ubuntu VM after the project files are in /opt/inmob
set -euo pipefail
cd /opt/inmob

sudo apt-get update
sudo apt-get install -y docker.io docker-compose-v2
sudo usermod -aG docker "$USER" || true
sudo systemctl enable --now docker

IP="$(curl -s -H 'Metadata-Flavor: Google' \
  http://metadata.google.internal/computeMetadata/v1/instance/network-interfaces/0/access-configs/0/external-ip)"
DOMAIN="${IP}.sslip.io"

if [[ ! -f .env.prod ]]; then
  echo "Missing /opt/inmob/.env.prod"
  exit 1
fi

sed -i "s#__DOMAIN__#${DOMAIN}#g" .env.prod
sed -i "s#__IP__#${IP}#g" .env.prod

sudo docker compose -f docker-compose.prod.yml --env-file .env.prod up -d --build
sudo docker compose -f docker-compose.prod.yml --env-file .env.prod exec -T api \
  npm run migration:run || true

echo
echo "Sitio: https://${DOMAIN}"
echo "Admin: https://${DOMAIN}/admin/login"
