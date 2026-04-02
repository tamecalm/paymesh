import { Observable } from 'rxjs';

export interface IGetUserByIdRequest {
  id: string;
}

export interface IUserResponse {
  id: string;
  name: string;
  email: string;
  created_at: string;
  updated_at: string;
}

export interface IUserServiceGrpcClient {
  getUserById(data: IGetUserByIdRequest): Observable<IUserResponse>;
}
