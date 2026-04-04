#!/bin/bash
set -euo pipefail

REPO_ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$REPO_ROOT"

export PM2_HOME="${PM2_HOME:-$REPO_ROOT/.pm2}"
mkdir -p "$PM2_HOME"

pm2_cmd() {
  pnpm exec pm2 "$@"
}

wait_for_port() {
  local host="$1"
  local port="$2"
  local service_name="$3"

  while ! (echo >"/dev/tcp/${host}/${port}") >/dev/null 2>&1; do
    echo "Waiting for ${service_name} on ${host}:${port}..."
    sleep 1
  done
}

# Start user service first because wallet service depends on it.
pm2_cmd start pm2/ecosystem.config.js --only user-service

# Wait for user service to accept connections on port 50051.
wait_for_port 127.0.0.1 50051 user-service

# Start wallet service after user service is ready.
pm2_cmd start pm2/ecosystem.config.js --only wallet-service

# Persist process list for pm2 startup/reboot recovery.
pm2_cmd save

echo "Both services started and PM2 process list saved."
