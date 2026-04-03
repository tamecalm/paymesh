# paymesh

paymesh is a backend system composed of two NestJS gRPC services that manage users and wallet balances against a shared PostgreSQL database through Prisma.

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

3. Set the runtime values in this file.

```text
.env
```

```dotenv
DATABASE_URL=postgresql://postgres:password@localhost:5432/paymesh?schema=public
USER_GRPC_HOST=localhost
USER_GRPC_PORT=50051
WALLET_GRPC_PORT=50052
GRPC_API_KEY=8d6b9d3f2bc1baf5db9a6fddbb2b4a9d0a2b09858c4e7427da0dc8a9c8a6b5f1
NODE_ENV=development
LOG_LEVEL=info
```

## Database

Run every Prisma migration command from this directory.

```text
packages/prisma
```

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

1. Load the root environment file from the Prisma package directory.

```bash
cd packages/prisma
set -a
source ../../.env
set +a
```

2. Regenerate the Prisma client.

```bash
pnpm prisma generate
```

### Reset the Database

1. Load the root environment file from the Prisma package directory.

```bash
cd packages/prisma
set -a
source ../../.env
set +a
```

2. Reset the database and regenerate the Prisma client. Run this in development only because it drops all data.

```bash
pnpm prisma migrate reset --force
pnpm prisma generate
```

## Running the Services

Run both services before you send any gRPC request.

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

## Authentication

Every inbound gRPC call must include the `x-api-key` metadata header, and the value must match `GRPC_API_KEY`.

Pass the header with `grpcurl` like this.

```bash
grpcurl -plaintext -import-path ./packages/proto -proto user.proto -H 'x-api-key: your-api-key' -d '{"id":"00000000-0000-0000-0000-000000000000"}' localhost:50051 user.UserService/GetUserById
```

`wallet-service` forwards the same key automatically when it calls `user-service` during `CreateWallet`, so external clients send one shared secret and the internal gRPC hop reuses it.

## Example Requests

Run these commands from the repository root after both services are listening. `grpcurl` omits zero-valued proto fields, so a newly created wallet response does not print `balance` until the value is non-zero.

### CreateUser

Create a new user in `user.UserService`.

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

Fetch the user you created from `user.UserService`.

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

Create a wallet for the user in `wallet.WalletService`.

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

Fetch the wallet you created from `wallet.WalletService`.

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

Credit the wallet with a decimal amount in `wallet.WalletService`.

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

Debit the wallet with a decimal amount in `wallet.WalletService`.

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
