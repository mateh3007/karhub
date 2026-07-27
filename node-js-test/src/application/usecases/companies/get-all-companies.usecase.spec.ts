import { CompanyEntity } from 'src/domain/entities/company.entity';
import { CompanyRepository } from 'src/domain/repositories/company.repository';
import { GetAllCompaniesUseCase } from './get-all-companies.usecase';

describe('GetAllCompaniesUseCase', () => {
  it("returns only the caller's own company, wrapped in an array", async () => {
    const company = new CompanyEntity({
      corporateName: 'Auto Pecas LTDA',
      tradeName: 'Auto Pecas',
      cnpj: '12345678000199',
      contactEmail: 'contato@autopecas.com',
      phone: '11999999999',
    });
    const companyRepository = {
      findById: jest.fn().mockResolvedValue(company),
    } as unknown as jest.Mocked<CompanyRepository>;
    const useCase = new GetAllCompaniesUseCase(companyRepository);

    const result = await useCase.execute({ companyId: company.id });

    expect(companyRepository.findById).toHaveBeenCalledWith(company.id);
    expect(result).toEqual([company]);
  });

  it('returns an empty array when the caller has no company', async () => {
    const companyRepository = {
      findById: jest.fn().mockResolvedValue(null),
    } as unknown as jest.Mocked<CompanyRepository>;
    const useCase = new GetAllCompaniesUseCase(companyRepository);

    const result = await useCase.execute({ companyId: 'missing-id' });

    expect(result).toEqual([]);
  });
});
