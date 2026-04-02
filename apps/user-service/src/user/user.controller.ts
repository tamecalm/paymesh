import { Controller } from '@nestjs/common';
import { GrpcMethod } from '@nestjs/microservices';
import { UserService } from './user.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UserResponseDto } from './dto/user-response.dto';
import { IGetUserByIdRequest } from './interfaces/user-grpc.interface';

@Controller()
export class UserController {
  constructor(private readonly userService: UserService) {}

  @GrpcMethod('UserService', 'CreateUser')
  createUser(dto: CreateUserDto): Promise<UserResponseDto> {
    return this.userService.createUser(dto);
  }

  @GrpcMethod('UserService', 'GetUserById')
  getUserById(data: IGetUserByIdRequest): Promise<UserResponseDto> {
    return this.userService.getUserById(data);
  }
}
