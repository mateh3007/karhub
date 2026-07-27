import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import * as bcrypt from 'bcryptjs';
import { UserEntity } from 'src/domain/entities/user.entity';
import { IUpdateUser } from 'src/domain/interfaces/users/update-user.interface';
import { UserRepository } from 'src/domain/repositories/user.repository';
import { BaseUsecase } from 'src/shared/bases/base.usecase';

@Injectable()
export class UpdateUserUseCase extends BaseUsecase<IUpdateUser, UserEntity> {
  constructor(private readonly userRepository: UserRepository) {
    super();
  }

  async execute(data: IUpdateUser): Promise<UserEntity> {
    const user = await this.userRepository.findByIdAndCompanyId(
      data.id,
      data.companyId,
    );
    if (!user) {
      throw new NotFoundException('User not found');
    }

    if (data.email && data.email !== user.email) {
      const userWithEmail = await this.userRepository.findByEmail(data.email);
      if (userWithEmail) {
        throw new BadRequestException('User already exists');
      }
      user.email = data.email;
    }

    if (data.name) {
      user.name = data.name;
    }

    if (data.role) {
      user.role = data.role;
    }

    if (data.password) {
      user.password = await bcrypt.hash(data.password, 10);
    }

    return this.userRepository.update(user);
  }
}
