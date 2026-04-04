const path = require('path');
const fs = require('fs');

// Parse root .env file
const envPath = path.resolve(__dirname, '..', '.env');
const envVars = {};

fs.readFileSync(envPath, 'utf-8')
  .split('\n')
  .forEach((line) => {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) return;
    const eqIndex = trimmed.indexOf('=');
    if (eqIndex === -1) return;
    const key = trimmed.substring(0, eqIndex).trim();
    const value = trimmed.substring(eqIndex + 1).trim();
    envVars[key] = value;
  });

module.exports = {
  apps: [
    {
      name: 'user-service',
      cwd: path.resolve(__dirname, '..', 'apps', 'user-service'),
      script: 'dist/main.js',
      env: envVars,
      instances: 1,
      exec_mode: 'fork',
      autorestart: true,
      max_restarts: 10,
      restart_delay: 5000,
      max_memory_restart: '512M',
      watch: false,
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
    },
    {
      name: 'wallet-service',
      cwd: path.resolve(__dirname, '..', 'apps', 'wallet-service'),
      script: 'dist/main.js',
      env: envVars,
      instances: 1,
      exec_mode: 'fork',
      autorestart: true,
      max_restarts: 10,
      restart_delay: 5000,
      max_memory_restart: '512M',
      watch: false,
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
    },
  ],
};
