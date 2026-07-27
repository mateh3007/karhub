import { Injectable, NotFoundException } from '@nestjs/common';
import { CompanyEntity } from 'src/domain/entities/company.entity';
import { ICompanyScope } from 'src/domain/interfaces/companies/company-scope.interface';
import { CompanyRepository } from 'src/domain/repositories/company.repository';
import { BaseUsecase } from 'src/shared/bases/base.usecase';

@Injectable()
export class GetCompanyByIdUseCase extends BaseUsecase<
  ICompanyScope,
  CompanyEntity
> {
  constructor(private readonly companyRepository: CompanyRepository) {
    super();
  }

  async execute(data: ICompanyScope): Promise<CompanyEntity> {
    const company = await this.companyRepository.findById(data.id);
    if (!company || company.id !== data.companyId) {
      throw new NotFoundException('Company not found');
    }

    return company;
  }
}
