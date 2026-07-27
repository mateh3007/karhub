import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { CompanyEntity } from 'src/domain/entities/company.entity';
import { IUpdateCompany } from 'src/domain/interfaces/companies/update-company.interface';
import { CompanyRepository } from 'src/domain/repositories/company.repository';
import { BaseUsecase } from 'src/shared/bases/base.usecase';

@Injectable()
export class UpdateCompanyUseCase extends BaseUsecase<
  IUpdateCompany,
  CompanyEntity
> {
  constructor(private readonly companyRepository: CompanyRepository) {
    super();
  }

  async execute(data: IUpdateCompany): Promise<CompanyEntity> {
    const company = await this.companyRepository.findById(data.id);
    if (!company || company.id !== data.companyId) {
      throw new NotFoundException('Company not found');
    }

    if (data.contactEmail && data.contactEmail !== company.contactEmail) {
      const companyWithEmail = await this.companyRepository.findByEmail(
        data.contactEmail,
      );
      if (companyWithEmail) {
        throw new BadRequestException('Company already exists');
      }
      company.contactEmail = data.contactEmail;
    }

    if (data.corporateName) {
      company.corporateName = data.corporateName;
    }

    if (data.tradeName) {
      company.tradeName = data.tradeName;
    }

    if (data.phone) {
      company.phone = data.phone;
    }

    return this.companyRepository.update(company);
  }
}
