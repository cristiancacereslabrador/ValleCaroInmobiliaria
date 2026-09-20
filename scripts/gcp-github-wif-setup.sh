#!/usr/bin/env bash
# One-time setup. Paste this entire file into Google Cloud Shell.
set -euo pipefail

PROJECT_ID="project-109d2907-7ec6-4594-814"
PROJECT_NUMBER="791389290470"
REPO="cristiancacereslabrador/ValleCaroInmobiliaria"
SA_NAME="github-deploy"
SA_EMAIL="${SA_NAME}@${PROJECT_ID}.iam.gserviceaccount.com"
POOL="github-pool"
PROVIDER="github-provider"

gcloud config set project "${PROJECT_ID}"
gcloud services enable \
  iam.googleapis.com \
  iamcredentials.googleapis.com \
  cloudresourcemanager.googleapis.com \
  sts.googleapis.com \
  compute.googleapis.com \
  iap.googleapis.com

gcloud iam service-accounts create "${SA_NAME}" \
  --display-name="GitHub Actions deploy" || true

for ROLE in \
  roles/compute.osAdminLogin \
  roles/compute.osLogin \
  roles/compute.instanceAdmin.v1 \
  roles/iam.serviceAccountUser \
  roles/iap.tunnelResourceAccessor
do
  gcloud projects add-iam-policy-binding "${PROJECT_ID}" \
    --member="serviceAccount:${SA_EMAIL}" \
    --role="${ROLE}" \
    --quiet
done

gcloud iam workload-identity-pools create "${POOL}" \
  --location="global" \
  --display-name="GitHub" || true

gcloud iam workload-identity-pools providers create-oidc "${PROVIDER}" \
  --location="global" \
  --workload-identity-pool="${POOL}" \
  --display-name="GitHub OIDC" \
  --issuer-uri="https://token.actions.githubusercontent.com" \
  --attribute-mapping="google.subject=assertion.sub,attribute.repository=assertion.repository,attribute.ref=assertion.ref" \
  --attribute-condition="assertion.repository=='${REPO}'" || true

gcloud iam service-accounts add-iam-policy-binding "${SA_EMAIL}" \
  --role="roles/iam.workloadIdentityUser" \
  --member="principalSet://iam.googleapis.com/projects/${PROJECT_NUMBER}/locations/global/workloadIdentityPools/${POOL}/attribute.repository/${REPO}"

gcloud compute firewall-rules create allow-ssh-iap \
  --direction=INGRESS \
  --action=ALLOW \
  --rules=tcp:22 \
  --source-ranges=35.235.240.0/20 \
  --quiet || true

echo
echo "Listo. El siguiente git push a inmob-2026 actualiza https://35.237.71.162.sslip.io"
