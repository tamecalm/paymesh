#!/bin/bash
set -e

REPO_ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$REPO_ROOT/pm2"

# Start user service first because wallet service depends on it
pm2 start ecosystem.config.js --only user-service

# Wait for user service to accept connections on port 50051
while ! nc -z 127.0.0.1 50051; do
  echo "Waiting for user service..."
  sleep 1
done

# Start wallet service after user service is ready
pm2 start ecosystem.config.js --only wallet-service

# Persist process list for pm2 startup/reboot recovery
pm2 save

echo "Both services started and PM2 process list saved."
