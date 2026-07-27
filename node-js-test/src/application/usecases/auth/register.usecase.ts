import { BadRequestException, Injectable } from '@nestjs/common';
import * as bcrypt from 'bcryptjs';
import { CompanyEntity } from 'src/domain/entities/company.entity';
import { UserEntity } from 'src/domain/entities/user.entity';
import { RoleEnum } from 'src/domain/enums/role.enum';
import {
  IRegister,
  IRegisterResult,
} from 'src/domain/interfaces/auth/register.interface';
import { CompanyRepository } from 'src/domain/repositories/company.repository';
import { UserRepository } from 'src/domain/repositories/user.repository';
import { BaseUsecase } from 'src/shared/bases/base.usecase';

@Injectable()
export class RegisterUseCase extends BaseUsecase<IRegister, IRegisterResult> {
  constructor(
    private readonly companyRepository: CompanyRepository,
    private readonly userRepository: UserRepository,
  ) {
    super();
  }

  async execute(data: IRegister): Promise<IRegisterResult> {
    let companyAlreadyExists = await this.companyRepository.findByCnpj(
      data.cnpj,
    );
    if (companyAlreadyExists) {
      throw new BadRequestException('Company already exists');
    }

    companyAlreadyExists = await this.companyRepository.findByEmail(
      data.contactEmail,
    );
    if (companyAlreadyExists) {
      throw new BadRequestException('Company already exists');
    }

    const adminAlreadyExists = await this.userRepository.findByEmail(
      data.contactEmail,
    );
    if (adminAlreadyExists) {
      throw new BadRequestException('User already exists');
    }

    const company = await this.companyRepository.create(
      new CompanyEntity({
        corporateName: data.corporateName,
        tradeName: data.tradeName,
        cnpj: data.cnpj,
        contactEmail: data.contactEmail,
        phone: data.phone,
      }),
    );

    const hashedPassword = await bcrypt.hash(data.adminPassword, 10);
    const admin = await this.userRepository.create(
      new UserEntity({
        name: data.adminName,
        email: company.contactEmail,
        password: hashedPassword,
        role: RoleEnum.ADMIN,
        companyId: company.id,
      }),
    );

    return { company, user: admin };
  }
}
