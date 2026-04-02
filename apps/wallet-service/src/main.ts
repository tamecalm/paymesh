import { NestFactory } from '@nestjs/core';
import { MicroserviceOptions, Transport } from '@nestjs/microservices';
import * as path from 'path';
import { AppModule } from './app.module';

async function bootstrap(): Promise<void> {
  const port = process.env.WALLET_GRPC_PORT ?? 50052;
  const app = await NestFactory.createMicroservice<MicroserviceOptions>(
    AppModule,
    {
      transport: Transport.GRPC,
      options: {
        package: 'wallet',
        protoPath: path.join(__dirname, '../../../packages/proto/wallet.proto'),
        url: `0.0.0.0:${port}`,
      },
    },
  );

  await app.listen();
  console.log(`wallet-service gRPC server is running on port ${port}`);
}

void bootstrap();
