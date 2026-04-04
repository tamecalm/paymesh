import { type ExecutionContext } from '@nestjs/common';
import { UnauthenticatedException } from '../exceptions/unauthenticated.exception';
import { GrpcApiKeyGuard } from './grpc-api-key.guard';

describe('GrpcApiKeyGuard', () => {
  let guard: GrpcApiKeyGuard;

  beforeEach(() => {
    process.env.GRPC_API_KEY = 'test-secret';
    guard = new GrpcApiKeyGuard();
  });

  afterEach(() => {
    delete process.env.GRPC_API_KEY;
    jest.clearAllMocks();
  });

  const buildContext = (metadataValues: unknown[] | undefined): ExecutionContext => {
    const metadata = {
      get: jest.fn().mockImplementation((key: string) => {
        if (key === 'x-api-key') {
          return metadataValues ?? [];
        }

        return [];
      }),
    };

    return {
      switchToRpc: () => ({
        getContext: () => metadata,
      }),
    } as unknown as ExecutionContext;
  };

  it('should return true when the correct API key is provided', () => {
    const context = buildContext(['test-secret']);

    expect(guard.canActivate(context)).toBe(true);
  });

  it('should throw UnauthenticatedException when no x-api-key header is present', () => {
    const context = buildContext(undefined);

    expect(() => guard.canActivate(context)).toThrow(UnauthenticatedException);
  });

  it('should throw UnauthenticatedException when x-api-key header is an empty string', () => {
    const context = buildContext(['']);

    expect(() => guard.canActivate(context)).toThrow(UnauthenticatedException);
  });

  it('should throw UnauthenticatedException when x-api-key does not match GRPC_API_KEY', () => {
    const context = buildContext(['wrong-key']);

    expect(() => guard.canActivate(context)).toThrow(UnauthenticatedException);
  });

  it('should throw UnauthenticatedException when GRPC_API_KEY env variable is not set', () => {
    delete process.env.GRPC_API_KEY;
    const context = buildContext(['test-secret']);

    expect(() => guard.canActivate(context)).toThrow(UnauthenticatedException);
  });

  it('should throw UnauthenticatedException when metadata value is not a string', () => {
    const context = buildContext([undefined]);

    expect(() => guard.canActivate(context)).toThrow(UnauthenticatedException);
  });
});
