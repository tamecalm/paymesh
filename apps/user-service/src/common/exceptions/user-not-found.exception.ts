import { status } from '@grpc/grpc-js';
import { RpcException } from '@nestjs/microservices';

export class UserNotFoundException extends RpcException {
  constructor(id?: string) {
    super({
      code: status.NOT_FOUND,
      message: id ? `User with id ${id} not found` : 'User not found',
    });
  }
}
