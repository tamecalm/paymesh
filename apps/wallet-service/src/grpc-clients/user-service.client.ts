import { ClientsModule, Transport } from '@nestjs/microservices';
import * as path from 'path';

export const USER_SERVICE = 'USER_SERVICE';

export const USER_SERVICE_CLIENT_MODULE = ClientsModule.register([
  {
    name: USER_SERVICE,
    transport: Transport.GRPC,
    options: {
      package: 'user',
      protoPath: path.join(__dirname, '../../../../packages/proto/user.proto'),
      url: `${process.env.USER_GRPC_HOST ?? 'localhost'}:${
        process.env.USER_GRPC_PORT ?? 50051
      }`,
    },
  },
]);
