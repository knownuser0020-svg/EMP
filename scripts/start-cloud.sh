#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")/.."
mkdir -p .local
bash scripts/local-env.sh
docker compose up -d postgres
if ! curl --fail --silent http://127.0.0.1:8080/actuator/health >/dev/null; then
 if [[ ! -f ems-backend/target/ems-backend-1.0.0.jar ]]; then ems-backend/mvnw -f ems-backend/pom.xml -B package -DskipTests; fi
 cp ems-backend/target/ems-backend-1.0.0.jar .local/runtime.jar
 nohup bash scripts/run-api-jar.sh > .local/api.log 2>&1 &
fi
for attempt in {1..40}; do
 if curl --fail --silent http://127.0.0.1:8080/actuator/health >/dev/null; then break; fi
 if [[ "$attempt" == 40 ]]; then echo 'API did not become healthy. Inspect .local/api.log.' >&2; exit 1; fi
 sleep 1
done
if ! curl --fail --silent http://127.0.0.1:5173/ >/dev/null; then nohup npm run dev > .local/admin.log 2>&1 & fi
if ! curl --fail --silent http://127.0.0.1:5174/ >/dev/null; then nohup npm run dev:employee > .local/employee.log 2>&1 & fi
for attempt in {1..20}; do
 if curl --fail --silent http://127.0.0.1:5173/ >/dev/null && curl --fail --silent http://127.0.0.1:5174/ >/dev/null; then echo 'API and both demo interfaces are responding.'; exit 0; fi
 sleep 1
done
echo 'A frontend did not start. Inspect .local/admin.log and .local/employee.log.' >&2
exit 1
