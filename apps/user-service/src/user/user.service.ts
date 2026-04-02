import { status } from '@grpc/grpc-js';
import { Injectable } from '@nestjs/common';
import { RpcException } from '@nestjs/microservices';
import { UserNotFoundException } from '../common/exceptions/user-not-found.exception';
import { CreateUserDto } from './dto/create-user.dto';
import { UserResponseDto } from './dto/user-response.dto';
import { UserRepository } from './user.repository';

@Injectable()
export class UserService {
  constructor(private readonly userRepository: UserRepository) {}

  async createUser(dto: CreateUserDto): Promise<UserResponseDto> {
    const existingUser = await this.userRepository.findByEmail(dto.email);

    if (existingUser) {
      throw new RpcException({
        code: status.ALREADY_EXISTS,
        message: 'User with this email already exists',
      });
    }

    const user = await this.userRepository.create({
      name: dto.name,
      email: dto.email,
    });

    return UserResponseDto.fromPrisma(user);
  }

  async getUserById(data: { id: string }): Promise<UserResponseDto> {
    const user = await this.userRepository.findById(data.id);

    if (!user) {
      throw new UserNotFoundException();
    }

    return UserResponseDto.fromPrisma(user);
  }
}
