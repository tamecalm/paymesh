import { Observable } from 'rxjs';

export interface ICreateUserRequest {
  name: string;
  email: string;
}

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

export interface IUserServiceGrpc {
  createUser(request: ICreateUserRequest): Observable<IUserResponse>;
  getUserById(request: IGetUserByIdRequest): Observable<IUserResponse>;
}
