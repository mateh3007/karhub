import { PartEntity } from 'src/domain/entities/part.entity';
import { PartRepository } from 'src/domain/repositories/part.repository';
import { GetAllPartsUseCase } from './get-all-parts.usecase';

describe('GetAllPartsUseCase', () => {
  let partRepository: jest.Mocked<PartRepository>;
  let useCase: GetAllPartsUseCase;

  beforeEach(() => {
    partRepository = {
      findByCompanyId: jest.fn(),
    } as unknown as jest.Mocked<PartRepository>;
    useCase = new GetAllPartsUseCase(partRepository);
  });

  it('delegates to the repository scoped by companyId and an optional category', async () => {
    const parts = [
      new PartEntity({
        name: 'Part A',
        category: 'engine',
        currentStock: 1,
        minimumStock: 1,
        averageDailySales: 1,
        leadTimeDays: 1,
        unitCost: 1,
        criticalityLevel: 1,
        companyId: 'company-1',
      }),
    ];
    partRepository.findByCompanyId.mockResolvedValue(parts);

    const result = await useCase.execute({
      companyId: 'company-1',
      category: 'engine',
    });

    expect(partRepository.findByCompanyId).toHaveBeenCalledWith(
      'company-1',
      'engine',
    );
    expect(result).toBe(parts);
  });

  it('passes undefined category through when none is provided', async () => {
    partRepository.findByCompanyId.mockResolvedValue([]);

    await useCase.execute({ companyId: 'company-1' });

    expect(partRepository.findByCompanyId).toHaveBeenCalledWith(
      'company-1',
      undefined,
    );
  });
});
