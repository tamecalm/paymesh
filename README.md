Paymesh is a NestJS gRPC microservices backed by a shared PostgreSQL database through Prisma.

- `user-service` owns user creation and lookup.
- `wallet-service` owns wallet creation, lookup, credit, and debit.
- Services communicate over gRPC using `@nestjs/microservices` and `@grpc/grpc-js`.
- Persistence is handled through Prisma 5 against PostgreSQL.

## Prerequisites
Install these before you run anything:

- Node.js 20 LTS
- pnpm 8 or newer
- PostgreSQL 15 or newer
- `grpcurl` 1.9.3 or newer

Install `grpcurl`:

```bash
# macOS
brew install grpcurl
```

```bash
# Linux
go install github.com/fullstorydev/grpcurl/cmd/grpcurl@latest
```

Verify the binary:

```bash
grpcurl --version
```

Expected output:

```text
grpcurl v1.9.3
```

## Getting Started
Clone the repository, install dependencies, create the environment file, and create the database that matches `DATABASE_URL`.

```bash
git clone https://github.com/tamecalm/paymesh.git
cd paymesh
pnpm install
cp .env.example .env
PGPASSWORD='password' psql -h localhost -p 5432 -U postgres -d postgres -c "CREATE DATABASE paymesh;"
```

The checked-in `.env.example` uses this default database URL:

```text
postgresql://postgres:password@localhost:5432/paymesh?schema=public
```

If your local PostgreSQL username, password, host, or port is different, update `.env` before you continue.

## Running Migrations
Prisma commands are executed from `packages/prisma`. Export the root `.env` into your shell before you run them.

Generate the Prisma client:

```bash
cd paymesh
set -a
source .env
set +a
cd packages/prisma
pnpm prisma generate
```

Apply the checked-in migrations to your local database:

```bash
cd paymesh
set -a
source .env
set +a
cd packages/prisma
pnpm prisma migrate deploy
```

Reset the local database and reapply all migrations:

```bash
cd paymesh
set -a
source .env
set +a
cd packages/prisma
pnpm prisma migrate reset --force
pnpm prisma generate
```

Use `migrate reset` only for local development. It drops all data in the target database.

## Running the Services
Open two terminals. In each terminal, start from the repository root, export the environment, and then start the service.

Terminal 1: user-service

```bash
cd paymesh
set -a
source .env
set +a
cd apps/user-service
pnpm build
pnpm start
```

Terminal 2: wallet-service

```bash
cd paymesh
set -a
source .env
set +a
cd apps/wallet-service
pnpm build
pnpm start
```

Ports:

- `user-service` listens on `50051`
- `wallet-service` listens on `50052`

A successful user-service startup looks like this:

```text
[Nest] ... LOG [NestMicroservice] Nest microservice successfully started
user-service gRPC server is running on port 50051
```

A successful wallet-service startup looks like this:

```text
[Nest] ... LOG [NestMicroservice] Nest microservice successfully started
wallet-service gRPC server is running on port 50052
```

## Example Requests
Run every command below from the repository root.

`grpcurl` accepts the request field names from the proto files (`user_id`, `wallet_id`). Response JSON uses protobuf JSON names (`userId`, `createdAt`, `updatedAt`). Also note: `grpcurl` omits zero-valued numeric fields, so a newly created wallet does not print `balance` until it has been credited.

### 1. CreateUser
```bash
grpcurl -plaintext -import-path ./packages/proto -proto user.proto -d '{"name":"Test User","email":"test-20260403-0219@paymesh.dev"}' localhost:50051 user.UserService/CreateUser
```

```json
{
  "id": "df4176a8-23b4-42e8-85c8-dc750af528d6",
  "name": "Test User",
  "email": "test-20260403-0219@paymesh.dev",
  "createdAt": "2026-04-03T01:19:06.678Z",
  "updatedAt": "2026-04-03T01:19:06.678Z"
}
```

### 2. GetUserById
```bash
grpcurl -plaintext -import-path ./packages/proto -proto user.proto -d '{"id":"df4176a8-23b4-42e8-85c8-dc750af528d6"}' localhost:50051 user.UserService/GetUserById
```

```json
{
  "id": "df4176a8-23b4-42e8-85c8-dc750af528d6",
  "name": "Test User",
  "email": "test-20260403-0219@paymesh.dev",
  "createdAt": "2026-04-03T01:19:06.678Z",
  "updatedAt": "2026-04-03T01:19:06.678Z"
}
```

### 3. CreateWallet
```bash
grpcurl -plaintext -import-path ./packages/proto -proto wallet.proto -d '{"user_id":"df4176a8-23b4-42e8-85c8-dc750af528d6"}' localhost:50052 wallet.WalletService/CreateWallet
```

```json
{
  "id": "1b520098-978c-46ad-bc8a-6ae581ccfbc0",
  "userId": "df4176a8-23b4-42e8-85c8-dc750af528d6",
  "createdAt": "2026-04-03T01:19:39.775Z",
  "updatedAt": "2026-04-03T01:19:39.775Z"
}
```

### 4. GetWallet
```bash
grpcurl -plaintext -import-path ./packages/proto -proto wallet.proto -d '{"id":"1b520098-978c-46ad-bc8a-6ae581ccfbc0"}' localhost:50052 wallet.WalletService/GetWallet
```

```json
{
  "id": "1b520098-978c-46ad-bc8a-6ae581ccfbc0",
  "userId": "df4176a8-23b4-42e8-85c8-dc750af528d6",
  "createdAt": "2026-04-03T01:19:39.775Z",
  "updatedAt": "2026-04-03T01:19:39.775Z"
}
```

### 5. CreditWallet
```bash
grpcurl -plaintext -import-path ./packages/proto -proto wallet.proto -d '{"wallet_id":"1b520098-978c-46ad-bc8a-6ae581ccfbc0","amount":500}' localhost:50052 wallet.WalletService/CreditWallet
```

```json
{
  "id": "1b520098-978c-46ad-bc8a-6ae581ccfbc0",
  "userId": "df4176a8-23b4-42e8-85c8-dc750af528d6",
  "balance": 500,
  "createdAt": "2026-04-03T01:19:39.775Z",
  "updatedAt": "2026-04-03T01:19:50.722Z"
}
```

### 6. DebitWallet
```bash
grpcurl -plaintext -import-path ./packages/proto -proto wallet.proto -d '{"wallet_id":"1b520098-978c-46ad-bc8a-6ae581ccfbc0","amount":200}' localhost:50052 wallet.WalletService/DebitWallet
```

```json
{
  "id": "1b520098-978c-46ad-bc8a-6ae581ccfbc0",
  "userId": "df4176a8-23b4-42e8-85c8-dc750af528d6",
  "balance": 300,
  "createdAt": "2026-04-03T01:19:39.775Z",
  "updatedAt": "2026-04-03T01:19:56.703Z"
}
```

## Environment Variables
| Variable | Used By | Purpose | Default Value |
| --- | --- | --- | --- |
| `DATABASE_URL` | `@paymesh/prisma`, `user-service`, `wallet-service` | PostgreSQL connection string used by Prisma for all reads and writes. | `postgresql://postgres:password@localhost:5432/paymesh?schema=public` |
| `USER_GRPC_HOST` | `wallet-service` | Hostname used by the wallet-service gRPC client to call user-service. | `localhost` |
| `USER_GRPC_PORT` | `user-service`, `wallet-service` | Port user-service binds to, and the port wallet-service uses when dialing user-service. | `50051` |
| `WALLET_GRPC_PORT` | `wallet-service` | Port wallet-service binds to. | `50052` |
| `NODE_ENV` | runtime environment | Environment label passed into the service processes. The current code does not branch on it. | `development` |
| `LOG_LEVEL` | logging runtime | Log level passed into the service processes. The current code does not read it directly. | `info` |

## Error Reference
| gRPC Code | Returned By | When It Happens |
| --- | --- | --- |
| `ALREADY_EXISTS` | `CreateUser` | A user with the same email already exists. |
| `ALREADY_EXISTS` | `CreateWallet` | The target user already has a wallet. |
| `NOT_FOUND` | `GetUserById` | No user exists for the requested UUID. |
| `NOT_FOUND` | `CreateWallet` | The wallet-service cannot resolve the referenced user through user-service. |
| `NOT_FOUND` | `GetWallet` | No wallet exists for the requested UUID. |
| `NOT_FOUND` | `CreditWallet`, `DebitWallet` | No wallet exists for the requested `wallet_id`. |
| `FAILED_PRECONDITION` | `DebitWallet` | The requested debit amount is greater than the current wallet balance. |
| `UNKNOWN` | any method | An unhandled runtime failure occurred, such as a database connectivity issue or another non-`RpcException` server error. |
