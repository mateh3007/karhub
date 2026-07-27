import { Injectable } from '@nestjs/common';
import { CompanyEntity } from 'src/domain/entities/company.entity';
import { IFindAllCompanies } from 'src/domain/interfaces/companies/find-all-companies.interface';
import { CompanyRepository } from 'src/domain/repositories/company.repository';
import { BaseUsecase } from 'src/shared/bases/base.usecase';

@Injectable()
export class GetAllCompaniesUseCase extends BaseUsecase<
  IFindAllCompanies,
  CompanyEntity[]
> {
  constructor(private readonly companyRepository: CompanyRepository) {
    super();
  }

  async execute(data: IFindAllCompanies): Promise<CompanyEntity[]> {
    const company = await this.companyRepository.findById(data.companyId);
    return company ? [company] : [];
  }
}
