import { Injectable } from '@nestjs/common';
import { UserEntity } from 'src/domain/entities/user.entity';
import { IFindAllUsers } from 'src/domain/interfaces/users/find-all-users.interface';
import { UserRepository } from 'src/domain/repositories/user.repository';
import { BaseUsecase } from 'src/shared/bases/base.usecase';

@Injectable()
export class GetAllUsersUseCase extends BaseUsecase<
  IFindAllUsers,
  UserEntity[]
> {
  constructor(private readonly userRepository: UserRepository) {
    super();
  }

  async execute(data: IFindAllUsers): Promise<UserEntity[]> {
    return this.userRepository.findByCompanyId(data.companyId);
  }
}
