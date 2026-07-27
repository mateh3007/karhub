import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import * as bcrypt from 'bcryptjs';
import { UserEntity } from 'src/domain/entities/user.entity';
import { ICreateUser } from 'src/domain/interfaces/users/create-user.interface';
import { CompanyRepository } from 'src/domain/repositories/company.repository';
import { UserRepository } from 'src/domain/repositories/user.repository';
import { BaseUsecase } from 'src/shared/bases/base.usecase';

@Injectable()
export class CreateUserUseCase extends BaseUsecase<ICreateUser, UserEntity> {
  constructor(
    private readonly userRepository: UserRepository,
    private readonly companyRepository: CompanyRepository,
  ) {
    super();
  }

  async execute(data: ICreateUser): Promise<UserEntity> {
    const company = await this.companyRepository.findById(data.companyId);
    if (!company) {
      throw new NotFoundException('Company not found');
    }

    const userAlreadyExists = await this.userRepository.findByEmail(data.email);
    if (userAlreadyExists) {
      throw new BadRequestException('User already exists');
    }

    const hashedPassword = await bcrypt.hash(data.password, 10);
    const user = new UserEntity({ ...data, password: hashedPassword });
    return this.userRepository.create(user);
  }
}
