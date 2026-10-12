#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")/.."
if [[ -e .env ]]; then echo 'Preserving existing .env.'; exit 0; fi
umask 077
{ printf 'DATABASE_URL=jdbc:postgresql://localhost:5432/forma\nDATABASE_USER=forma\n'; printf 'DATABASE_PASSWORD=%s\n' "$(openssl rand -hex 24)"; printf 'JWT_SECRET=%s\n' "$(openssl rand -base64 48 | tr -d '\n')"; printf 'EMS_DEMO_PASSWORD=%s\n' "$(openssl rand -hex 16)"; printf 'SPRING_PROFILES_ACTIVE=demo\n'; } > .env
echo 'Created private local development configuration. Credentials were not printed.'
