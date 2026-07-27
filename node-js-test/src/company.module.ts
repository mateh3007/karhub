import { Module } from '@nestjs/common';
import { CreateCompanyUseCase } from './application/usecases/companies/create-company.usecase';
import { DeleteCompanyUseCase } from './application/usecases/companies/delete-company.usecase';
import { GetAllCompaniesUseCase } from './application/usecases/companies/get-all-companies.usecase';
import { GetCompanyByIdUseCase } from './application/usecases/companies/get-company-by-id.usecase';
import { UpdateCompanyUseCase } from './application/usecases/companies/update-company.usecase';
import { DatabaseModule } from './infra/database/database.module';
import { CompaniesController } from './presentation/controllers/companies.controller';

@Module({
  imports: [DatabaseModule],
  controllers: [CompaniesController],
  providers: [
    CreateCompanyUseCase,
    GetAllCompaniesUseCase,
    GetCompanyByIdUseCase,
    UpdateCompanyUseCase,
    DeleteCompanyUseCase,
  ],
})
export class CompanyModule {}
