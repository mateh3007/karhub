import { Injectable, NotFoundException } from '@nestjs/common';
import { UserEntity } from 'src/domain/entities/user.entity';
import { IUserScope } from 'src/domain/interfaces/users/user-scope.interface';
import { UserRepository } from 'src/domain/repositories/user.repository';
import { BaseUsecase } from 'src/shared/bases/base.usecase';

@Injectable()
export class GetUserByIdUseCase extends BaseUsecase<IUserScope, UserEntity> {
  constructor(private readonly userRepository: UserRepository) {
    super();
  }

  async execute(data: IUserScope): Promise<UserEntity> {
    const user = await this.userRepository.findByIdAndCompanyId(
      data.id,
      data.companyId,
    );
    if (!user) {
      throw new NotFoundException('User not found');
    }

    return user;
  }
}
