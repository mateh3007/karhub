import { Injectable, NotFoundException } from '@nestjs/common';
import { IUserScope } from 'src/domain/interfaces/users/user-scope.interface';
import { UserRepository } from 'src/domain/repositories/user.repository';
import { BaseUsecase } from 'src/shared/bases/base.usecase';

@Injectable()
export class DeleteUserUseCase extends BaseUsecase<IUserScope> {
  constructor(private readonly userRepository: UserRepository) {
    super();
  }

  async execute(data: IUserScope): Promise<void> {
    const user = await this.userRepository.findByIdAndCompanyId(
      data.id,
      data.companyId,
    );
    if (!user) {
      throw new NotFoundException('User not found');
    }

    await this.userRepository.delete(data.id);
  }
}
