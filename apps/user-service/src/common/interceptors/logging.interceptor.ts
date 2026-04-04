import { CallHandler, ExecutionContext, Injectable, Logger, NestInterceptor } from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';

@Injectable()
export class LoggingInterceptor implements NestInterceptor<unknown, unknown> {
  private readonly logger = new Logger(LoggingInterceptor.name);

  intercept(context: ExecutionContext, next: CallHandler<unknown>): Observable<unknown> {
    const startedAt = Date.now();
    const handler = context.getClass().name;
    const method = context.getHandler().name;

    this.logger.log({ method, handler, duration: 0 });

    return next.handle().pipe(
      tap({
        next: () => {
          this.logger.log({
            method,
            handler,
            duration: Date.now() - startedAt,
          });
        },
        error: () => {
          this.logger.error({
            method,
            handler,
            duration: Date.now() - startedAt,
          });
        },
      }),
    );
  }
}
