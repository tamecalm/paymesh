import { Metadata } from '@grpc/grpc-js';
import { Observable } from 'rxjs';

export interface IGetUserByIdRequest {
  id: string;
}

export interface IUserResponse {
  id: string;
  name: string;
  email: string;
  createdAt: string;
  updatedAt: string;
}

export interface IUserServiceGrpcClient {
  getUserById(
    data: IGetUserByIdRequest,
    metadata?: Metadata,
  ): Observable<IUserResponse>;
}
