#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")/.."
set -a
source .env
set +a
if [[ -x /workspace/.tools/jdk-21.0.9+10/bin/java ]]; then api_java=/workspace/.tools/jdk-21.0.9+10/bin/java; else api_java=java; fi
exec "$api_java" -XX:MaxRAMPercentage=75.0 -jar .local/runtime.jar
