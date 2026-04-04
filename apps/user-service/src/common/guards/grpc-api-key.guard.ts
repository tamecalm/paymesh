import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { Observable } from 'rxjs';
import { UnauthenticatedException } from '../exceptions/unauthenticated.exception';

@Injectable()
export class GrpcApiKeyGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean | Promise<boolean> | Observable<boolean> {
    const metadata = context.switchToRpc().getContext();
    const values = metadata.get('x-api-key');
    const incomingKey = values?.[0];

    if (typeof incomingKey !== 'string' || incomingKey.length === 0) {
      throw new UnauthenticatedException();
    }

    if (!process.env.GRPC_API_KEY || incomingKey !== process.env.GRPC_API_KEY) {
      throw new UnauthenticatedException();
    }

    return true;
  }
}
