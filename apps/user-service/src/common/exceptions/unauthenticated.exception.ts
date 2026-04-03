import { status } from '@grpc/grpc-js';
import { RpcException } from '@nestjs/microservices';

export class UnauthenticatedException extends RpcException {
  constructor() {
    super({
      code: status.UNAUTHENTICATED,
      message: 'Missing or invalid API key',
    });
  }
}
