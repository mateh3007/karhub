import { NotFoundException } from '@nestjs/common';
import { CompanyEntity } from 'src/domain/entities/company.entity';
import { CompanyRepository } from 'src/domain/repositories/company.repository';
import { GetCompanyByIdUseCase } from './get-company-by-id.usecase';

describe('GetCompanyByIdUseCase', () => {
  let companyRepository: jest.Mocked<CompanyRepository>;
  let useCase: GetCompanyByIdUseCase;

  beforeEach(() => {
    companyRepository = {
      findById: jest.fn(),
    } as unknown as jest.Mocked<CompanyRepository>;
    useCase = new GetCompanyByIdUseCase(companyRepository);
  });

  it("returns the company when it is the caller's own", async () => {
    const company = new CompanyEntity({
      corporateName: 'Auto Pecas LTDA',
      tradeName: 'Auto Pecas',
      cnpj: '12345678000199',
      contactEmail: 'contato@autopecas.com',
      phone: '11999999999',
    });
    companyRepository.findById.mockResolvedValue(company);

    const result = await useCase.execute({
      id: company.id,
      companyId: company.id,
    });

    expect(result).toBe(company);
  });

  it('throws NotFoundException when the company does not exist', async () => {
    companyRepository.findById.mockResolvedValue(null);

    await expect(
      useCase.execute({ id: 'missing-id', companyId: 'missing-id' }),
    ).rejects.toThrow(NotFoundException);
  });

  it("throws NotFoundException when the company exists but isn't the caller's own", async () => {
    const otherCompany = new CompanyEntity({
      corporateName: 'Other Company',
      tradeName: 'Other',
      cnpj: '99999999000199',
      contactEmail: 'other@company.com',
      phone: '11888888888',
    });
    companyRepository.findById.mockResolvedValue(otherCompany);

    await expect(
      useCase.execute({ id: otherCompany.id, companyId: 'caller-company' }),
    ).rejects.toThrow(NotFoundException);
  });
});
