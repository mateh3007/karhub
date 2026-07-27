import { PartEntity } from 'src/domain/entities/part.entity';
import { PartRepository } from 'src/domain/repositories/part.repository';
import { GetAllPartsUseCase } from './get-all-parts.usecase';

describe('GetAllPartsUseCase', () => {
  let partRepository: jest.Mocked<PartRepository>;
  let useCase: GetAllPartsUseCase;

  beforeEach(() => {
    partRepository = {
      findPageByCompanyId: jest.fn(),
    } as unknown as jest.Mocked<PartRepository>;
    useCase = new GetAllPartsUseCase(partRepository);
  });

  it('delegates to the repository scoped by companyId, pagination and an optional category', async () => {
    const part = new PartEntity({
      name: 'Part A',
      category: 'engine',
      currentStock: 1,
      minimumStock: 1,
      averageDailySales: 1,
      leadTimeDays: 1,
      unitCost: 1,
      criticalityLevel: 1,
      companyId: 'company-1',
    });
    const page = {
      data: [part],
      total: 1,
      page: 1,
      limit: 20,
      totalPages: 1,
    };
    partRepository.findPageByCompanyId.mockResolvedValue(page);

    const result = await useCase.execute({
      companyId: 'company-1',
      category: 'engine',
      page: 1,
      limit: 20,
    });

    expect(partRepository.findPageByCompanyId).toHaveBeenCalledWith(
      'company-1',
      { page: 1, limit: 20 },
      'engine',
    );
    expect(result).toBe(page);
  });

  it('passes undefined category through when none is provided', async () => {
    partRepository.findPageByCompanyId.mockResolvedValue({
      data: [],
      total: 0,
      page: 1,
      limit: 20,
      totalPages: 0,
    });

    await useCase.execute({ companyId: 'company-1', page: 1, limit: 20 });

    expect(partRepository.findPageByCompanyId).toHaveBeenCalledWith(
      'company-1',
      { page: 1, limit: 20 },
      undefined,
    );
  });
});
