import { BadRequestException, Injectable } from '@nestjs/common';
import { CompanyEntity } from 'src/domain/entities/company.entity';
import { ICreateCompany } from 'src/domain/interfaces/companies/create-company.interface';
import { CompanyRepository } from 'src/domain/repositories/company.repository';
import { BaseUsecase } from 'src/shared/bases/base.usecase';

@Injectable()
export class CreateCompanyUseCase extends BaseUsecase<
  ICreateCompany,
  CompanyEntity
> {
  constructor(private readonly companyRepository: CompanyRepository) {
    super();
  }

  async execute(data: ICreateCompany): Promise<CompanyEntity> {
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

    const company = new CompanyEntity(data);
    return this.companyRepository.create(company);
  }
}
