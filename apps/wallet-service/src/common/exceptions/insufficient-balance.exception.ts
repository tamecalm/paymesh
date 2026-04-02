import { status } from '@grpc/grpc-js';
import { RpcException } from '@nestjs/microservices';

export class InsufficientBalanceException extends RpcException {
  constructor(available: number, required: number) {
    super({
      code: status.FAILED_PRECONDITION,
      message: `Insufficient balance. Available: ${available}, Required: ${required}`,
    });
  }
}
