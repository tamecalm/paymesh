# Paymesh

Paymesh is a backend system composed of two NestJS gRPC services that manage users and wallet balances against a shared PostgreSQL database through Prisma.

## Tech Stack

| Layer | Technology | Version |
| --- | --- | --- |
| Language | TypeScript | 5.x |
| Runtime | Node.js | 20.x |
| Package Manager | pnpm | 10.x |
| Framework | NestJS | 10.x |
| Transport | gRPC with `@grpc/grpc-js` and `@grpc/proto-loader` | 1.x / 0.7.x |
| Data Access | Prisma | 5.x |
| Database | PostgreSQL | 15.x or newer |
| Testing | Jest with `@nestjs/testing` and `ts-jest` | 29.x / 10.x / 29.x |

## Prerequisites

1. Install Node.js 20.x from [nodejs.org](https://nodejs.org/en/download).
2. Install pnpm 10.x from [pnpm.io](https://pnpm.io/installation).
3. Install PostgreSQL 15.x or newer from [postgresql.org](https://www.postgresql.org/download/).
4. Install OpenSSL 3.x or newer from [openssl.org](https://www.openssl.org/source/).
5. Install grpcurl 1.9.x or newer from [fullstorydev/grpcurl](https://github.com/fullstorydev/grpcurl).

## Getting Started

### Clone and Install

1. Clone the repository and enter the workspace.

```bash
git clone https://github.com/tamecalm/paymesh.git
cd paymesh
```

2. Install workspace dependencies from the repository root.

```bash
pnpm install
```

### Configure Environment

1. Copy the checked-in environment file.

```bash
cp .env.example .env
```

2. Generate a strong shared API key. `GRPC_API_KEY` authenticates every inbound gRPC request to both services, and `wallet-service` forwards the same key when it calls `user-service` internally.

```bash
openssl rand -hex 32
```

3. Set the runtime values in `.env`.

```dotenv
DATABASE_URL=postgresql://postgres:password@localhost:5432/paymesh?schema=public
USER_GRPC_HOST=localhost
USER_GRPC_PORT=50051
WALLET_GRPC_PORT=50052
GRPC_API_KEY=your-generated-key-here
NODE_ENV=development
LOG_LEVEL=info
```

## Database

Run every Prisma migration command from the `packages/prisma` directory.

### Run the Initial Migration

1. Change into the Prisma package and load the root environment file.

```bash
cd packages/prisma
set -a
source ../../.env
set +a
```

2. Apply the checked-in migrations to the target database.

```bash
pnpm prisma migrate deploy
```

### Regenerate the Prisma Client After Schema Changes

```bash
cd packages/prisma
set -a
source ../../.env
set +a
pnpm prisma generate
```

### Reset the Database

Run this in development only — it drops all data.

```bash
cd packages/prisma
set -a
source ../../.env
set +a
pnpm prisma migrate reset --force
pnpm prisma generate
```

## Running the Services (Development)

Run both services before you send any gRPC request. Each service must have the environment loaded before starting.

1. Start `user-service`.

```bash
cd apps/user-service
set -a
source ../../.env
set +a
pnpm build
pnpm start
```

2. Start `wallet-service`.

```bash
cd apps/wallet-service
set -a
source ../../.env
set +a
pnpm build
pnpm start
```

| Service | Port |
| --- | --- |
| `user-service` | `50051` |
| `wallet-service` | `50052` |

A successful startup prints these service-specific lines.

```text
user-service gRPC server is running on port 50051
wallet-service gRPC server is running on port 50052
```

## Running the Services (Production)

In production, both services are managed by PM2 for crash recovery and boot persistence. The PM2 ecosystem config lives in `pm2/ecosystem.config.js` and reads environment variables directly from the root `.env` file without shell wrappers.

### Install PM2

```bash
npm install -g pm2
```

### Start Both Services

The root `package.json` exposes a `start` script that runs the PM2 sequential start wrapper. Run this from the repository root.

```bash
pnpm start
```

This starts `user-service` first, waits for port `50051` to be ready, then starts `wallet-service`, and saves the PM2 process list.

### Verify Both Services Are Running

```bash
pm2 status
```

### Enable Auto-Start on Server Reboot

```bash
pm2 startup
```

Copy and run the exact `sudo env PATH=...` command that PM2 prints, then save the process list.

```bash
pm2 save
```

### Useful PM2 Commands

| Command | Description |
| --- | --- |
| `pm2 status` | Show running processes and their status |
| `pm2 logs` | Stream logs from all services |
| `pm2 logs user-service` | Stream logs from `user-service` only |
| `pm2 restart all` | Restart all services (required after `.env` changes) |
| `pm2 delete all` | Stop and remove all processes |

## Nginx Reverse Proxy

In production, Nginx sits in front of both services as a gRPC-aware reverse proxy. The config lives in `nginx/paymesh-grpc.conf`. Nginx uses `grpc_pass` (not `proxy_pass`) because gRPC requires HTTP/2 framing that `proxy_pass` does not support.

### Install and Enable

```bash
sudo apt install -y nginx-full
sudo ln -s ~/paymesh/nginx/paymesh-grpc.conf /etc/nginx/sites-enabled/paymesh-grpc.conf
sudo nginx -t
sudo systemctl start nginx
sudo systemctl enable nginx
sudo systemctl reload nginx
```

### Provision TLS with Certbot

DNS for `paymesh.trimz.cc` must resolve directly to the EC2 public IP (Cloudflare proxy must be disabled and grey cloud, DNS only) before running certbot.

```bash
sudo apt install -y certbot python3-certbot-nginx
sudo certbot --nginx -d paymesh.trimz.cc
```

### Rollback Nginx

```bash
sudo rm /etc/nginx/sites-enabled/paymesh-grpc.conf
sudo systemctl reload nginx
```

## Live Deployment

Both gRPC services are deployed on an EC2 instance behind `paymesh.trimz.cc` with TLS termination at Nginx. HTTP traffic is automatically redirected to HTTPS.

| Endpoint | Address |
| --- | --- |
| Health check | `https://paymesh.trimz.cc` |
| User service gRPC (via Nginx TLS) | `paymesh.trimz.cc:443` |
| User service gRPC (direct) | `paymesh.trimz.cc:50051` |
| Wallet service gRPC (via Nginx TLS) | `paymesh.trimz.cc:443` |
| Wallet service gRPC (direct) | `paymesh.trimz.cc:50052` |

The health check endpoint returns a JSON response so you can verify the deployment is live at any time.

```bash
curl https://paymesh.trimz.cc
```

Expected response:

```json
{"status":"live","service":"paymesh","timestamp":"2026-04-04T..."}
```

> **Note:** The Cloudflare proxy must be disabled (grey cloud, DNS only) for the `paymesh` A record. Cloudflare's proxy blocks gRPC traffic on port 443.

## Authentication

Every inbound gRPC call must include the `x-api-key` metadata header, and the value must match `GRPC_API_KEY`.

Pass the header with `grpcurl` like this.

```bash
grpcurl -plaintext -import-path ./packages/proto -proto user.proto -H 'x-api-key: your-api-key' -d '{"id":"00000000-0000-0000-0000-000000000000"}' localhost:50051 user.UserService/GetUserById
```

`wallet-service` forwards the same key automatically when it calls `user-service` during `CreateWallet`, so external clients send one shared secret and the internal gRPC hop reuses it.

## Example Requests

### Local (Development)

Run these commands from the repository root after both services are listening. Use `-plaintext` for local connections on ports `50051` and `50052`.

### Remote (Production via Nginx TLS)

Replace `localhost:50051` or `localhost:50052` with `paymesh.trimz.cc:443` and remove the `-plaintext` flag. TLS certificates from Let's Encrypt are publicly trusted and no extra flags needed.

`grpcurl` omits zero-valued proto fields, so a newly created wallet response does not print `balance` until the value is non-zero.

### CreateUser

```bash
grpcurl -plaintext -import-path ./packages/proto -proto user.proto -H 'x-api-key: your-api-key' -d '{"name":"README Example","email":"readme.20260403@paymesh.dev"}' localhost:50051 user.UserService/CreateUser
```

Example response:

```json
{
  "id": "11111111-1111-4111-8111-111111111111",
  "name": "README Example",
  "email": "readme.20260403@paymesh.dev",
  "createdAt": "2026-04-03T12:00:00.000Z",
  "updatedAt": "2026-04-03T12:00:00.000Z"
}
```

### GetUserById

```bash
grpcurl -plaintext -import-path ./packages/proto -proto user.proto -H 'x-api-key: your-api-key' -d '{"id":"11111111-1111-4111-8111-111111111111"}' localhost:50051 user.UserService/GetUserById
```

Example response:

```json
{
  "id": "11111111-1111-4111-8111-111111111111",
  "name": "README Example",
  "email": "readme.20260403@paymesh.dev",
  "createdAt": "2026-04-03T12:00:00.000Z",
  "updatedAt": "2026-04-03T12:00:00.000Z"
}
```

### CreateWallet

```bash
grpcurl -plaintext -import-path ./packages/proto -proto wallet.proto -H 'x-api-key: your-api-key' -d '{"user_id":"11111111-1111-4111-8111-111111111111"}' localhost:50052 wallet.WalletService/CreateWallet
```

Example response:

```json
{
  "id": "22222222-2222-4222-8222-222222222222",
  "userId": "11111111-1111-4111-8111-111111111111",
  "createdAt": "2026-04-03T12:01:00.000Z",
  "updatedAt": "2026-04-03T12:01:00.000Z"
}
```

### GetWallet

```bash
grpcurl -plaintext -import-path ./packages/proto -proto wallet.proto -H 'x-api-key: your-api-key' -d '{"id":"22222222-2222-4222-8222-222222222222"}' localhost:50052 wallet.WalletService/GetWallet
```

Example response:

```json
{
  "id": "22222222-2222-4222-8222-222222222222",
  "userId": "11111111-1111-4111-8111-111111111111",
  "createdAt": "2026-04-03T12:01:00.000Z",
  "updatedAt": "2026-04-03T12:01:00.000Z"
}
```

### CreditWallet

```bash
grpcurl -plaintext -import-path ./packages/proto -proto wallet.proto -H 'x-api-key: your-api-key' -d '{"wallet_id":"22222222-2222-4222-8222-222222222222","amount":300.30}' localhost:50052 wallet.WalletService/CreditWallet
```

Example response:

```json
{
  "id": "22222222-2222-4222-8222-222222222222",
  "userId": "11111111-1111-4111-8111-111111111111",
  "balance": 300.3,
  "createdAt": "2026-04-03T12:01:00.000Z",
  "updatedAt": "2026-04-03T12:02:00.000Z"
}
```

### DebitWallet

```bash
grpcurl -plaintext -import-path ./packages/proto -proto wallet.proto -H 'x-api-key: your-api-key' -d '{"wallet_id":"22222222-2222-4222-8222-222222222222","amount":100.10}' localhost:50052 wallet.WalletService/DebitWallet
```

Example response:

```json
{
  "id": "22222222-2222-4222-8222-222222222222",
  "userId": "11111111-1111-4111-8111-111111111111",
  "balance": 200.2,
  "createdAt": "2026-04-03T12:01:00.000Z",
  "updatedAt": "2026-04-03T12:03:00.000Z"
}
```

## Environment Variables

| Variable | Service | Description | Default |
| --- | --- | --- | --- |
| `DATABASE_URL` | `user-service`, `wallet-service`, `@paymesh/prisma` | PostgreSQL connection string used by Prisma for all reads and writes. | `postgresql://postgres:password@localhost:5432/paymesh?schema=public` |
| `USER_GRPC_HOST` | `wallet-service` | Hostname that `wallet-service` uses for outbound gRPC calls to `user-service`. | `localhost` |
| `USER_GRPC_PORT` | `user-service`, `wallet-service` | Port that `user-service` listens on and `wallet-service` uses for outbound calls to it. | `50051` |
| `WALLET_GRPC_PORT` | `wallet-service` | Port that `wallet-service` listens on. | `50052` |
| `GRPC_API_KEY` | `user-service`, `wallet-service` | Shared inbound gRPC API key and forwarded service-to-service credential. | `change-me` |
| `NODE_ENV` | `user-service`, `wallet-service` | Runtime environment label. | `development` |
| `LOG_LEVEL` | `user-service`, `wallet-service` | Application log level. | `info` |

## Root Scripts

| Script | Command | Description |
| --- | --- | --- |
| `pnpm start` | `bash pm2/start.sh` | Start both services via PM2 in production |
| `pnpm lint` | `eslint "apps/**/*.ts" --fix` | Lint and auto-fix all TypeScript source files |
| `pnpm format` | `prettier --write "apps/**/*.ts"` | Format all TypeScript source files |

## Error Reference

| gRPC Status | Code | Trigger |
| --- | --- | --- |
| `UNAUTHENTICATED` | `16` | Any inbound request omits `x-api-key`, sends an empty value, or sends a value that does not match `GRPC_API_KEY`. |
| `ALREADY_EXISTS` | `6` | `CreateUser` receives an email that already exists. |
| `ALREADY_EXISTS` | `6` | `CreateWallet` receives a user that already has a wallet. |
| `NOT_FOUND` | `5` | `GetUserById` receives an unknown user id. |
| `NOT_FOUND` | `5` | `CreateWallet` cannot resolve the referenced user through `user-service`. |
| `NOT_FOUND` | `5` | `GetWallet`, `CreditWallet`, or `DebitWallet` receives an unknown wallet id. |
| `FAILED_PRECONDITION` | `9` | `DebitWallet` amount exceeds the available balance. |
| `INTERNAL` | `13` | An unexpected exception reaches the gRPC exception filter without a code and message payload. |

## Running Tests

1. Run the `user-service` test suite.

```bash
cd apps/user-service
pnpm test
```

2. Run the `wallet-service` test suite.

```bash
cd apps/wallet-service
pnpm test
```

3. Run `user-service` tests with coverage.

```bash
cd apps/user-service
pnpm test:cov
```

4. Run `wallet-service` tests with coverage.

```bash
cd apps/wallet-service
pnpm test:cov
```

## Limitations and Production Notes

- Wallet balances are stored as floating-point values. This is acceptable for the assessment scope, but a production system should use a Decimal/DECIMAL type (or integer minor units) to avoid floating-point rounding issues in financial calculations.
- PM2 process list must be saved with `pm2 save` after any change to the running processes. Forgetting this means a server reboot will not restore the services.
- Any change to `.env` requires `pm2 restart all` to take effect across both services simultaneously.
- The Cloudflare proxy must remain disabled (grey cloud and DNS only) for the `paymesh` A record. Enabling the orange cloud blocks gRPC traffic on port 443.
