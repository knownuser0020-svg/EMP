#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")/.."
# Use the existing isolated checkout. Do not create a worktree for ordinary cloud tasks.
mkdir -p /workspace/.tools .local
if ! command -v javac >/dev/null && [[ ! -x /workspace/.tools/jdk-21.0.9+10/bin/javac ]]; then
 archive="$(mktemp)"
 checksum="$(mktemp)"
 trap 'rm -f "$archive" "$checksum"' EXIT
 url='https://github.com/adoptium/temurin21-binaries/releases/download/jdk-21.0.9%2B10/OpenJDK21U-jdk_x64_linux_hotspot_21.0.9_10.tar.gz'
 curl -fsSL "$url" -o "$archive"
 curl -fsSL "$url.sha256.txt" -o "$checksum"
 printf '%s  %s\n' "$(awk '{print $1}' "$checksum")" "$archive" | sha256sum --check --status
 tar -xzf "$archive" -C /workspace/.tools
fi
python scripts/maven-network.py
ELECTRON_SKIP_BINARY_DOWNLOAD=1 npm ci --cache /workspace/.cache/npm --no-fund --no-audit
npm run typecheck
repo_dir="$(pwd)"
npm run build -w ems-admin-client -- --outDir "$repo_dir/.local/web/admin"
npm run build -w ems-employee-client -- --outDir "$repo_dir/.local/web/employee"
node scripts/build-electron.mjs admin
node scripts/build-electron.mjs employee
ems-backend/mvnw -f ems-backend/pom.xml -B package
