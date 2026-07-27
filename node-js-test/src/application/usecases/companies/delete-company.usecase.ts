import { Injectable, NotFoundException } from '@nestjs/common';
import { ICompanyScope } from 'src/domain/interfaces/companies/company-scope.interface';
import { CompanyRepository } from 'src/domain/repositories/company.repository';
import { BaseUsecase } from 'src/shared/bases/base.usecase';

@Injectable()
export class DeleteCompanyUseCase extends BaseUsecase<ICompanyScope> {
  constructor(private readonly companyRepository: CompanyRepository) {
    super();
  }

  async execute(data: ICompanyScope): Promise<void> {
    const company = await this.companyRepository.findById(data.id);
    if (!company || company.id !== data.companyId) {
      throw new NotFoundException('Company not found');
    }

    await this.companyRepository.delete(data.id);
  }
}
