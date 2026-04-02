import { status } from '@grpc/grpc-js';
import { RpcException } from '@nestjs/microservices';

export class WalletNotFoundException extends RpcException {
  constructor(id?: string) {
    super({
      code: status.NOT_FOUND,
      message: id ? `Wallet with id ${id} not found` : 'Wallet not found',
    });
  }
}
