import { NestFactory } from '@nestjs/core';
import { MicroserviceOptions, Transport } from '@nestjs/microservices';
import * as path from 'path';
import { AppModule } from './app.module';

async function bootstrap(): Promise<void> {
  const port = process.env.USER_GRPC_PORT ?? 50051;
  const app = await NestFactory.createMicroservice<MicroserviceOptions>(
    AppModule,
    {
      transport: Transport.GRPC,
      options: {
        package: 'user',
        protoPath: path.join(__dirname, '../../../packages/proto/user.proto'),
        url: `0.0.0.0:${port}`,
      },
    },
  );

  await app.listen();
  console.log(`user-service gRPC server is running on port ${port}`);
}

void bootstrap();
