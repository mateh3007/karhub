import { NotFoundException } from '@nestjs/common';
import { PartPriorityService } from 'src/application/services/part-priority.service';
import { CacheAdapter } from 'src/domain/adapters/cache.adapter';
import { PartEntity } from 'src/domain/entities/part.entity';
import { PartRepository } from 'src/domain/repositories/part.repository';
import { UpdatePartUseCase } from './update-part.usecase';

function makeExistingPart(): PartEntity {
  return new PartEntity({
    name: 'Filtro de Oleo X',
    category: 'engine',
    currentStock: 15,
    minimumStock: 20,
    averageDailySales: 4,
    leadTimeDays: 5,
    unitCost: 18.5,
    criticalityLevel: 3,
    companyId: 'company-1',
  });
}

describe('UpdatePartUseCase', () => {
  let partRepository: jest.Mocked<PartRepository>;
  let cacheAdapter: jest.Mocked<CacheAdapter>;
  let useCase: UpdatePartUseCase;

  beforeEach(() => {
    partRepository = {
      findByIdAndCompanyId: jest.fn(),
      update: jest.fn((entity: PartEntity) => Promise.resolve(entity)),
    } as unknown as jest.Mocked<PartRepository>;
    cacheAdapter = {
      get: jest.fn(),
      set: jest.fn(),
      del: jest.fn(),
    };
    useCase = new UpdatePartUseCase(partRepository, cacheAdapter);
  });

  it('throws NotFoundException when the part does not exist for that company', async () => {
    partRepository.findByIdAndCompanyId.mockResolvedValue(null);

    await expect(
      useCase.execute({
        id: 'missing-id',
        companyId: 'company-1',
        name: 'New Name',
      }),
    ).rejects.toThrow(NotFoundException);
    expect(partRepository.update).not.toHaveBeenCalled();
  });

  it('only applies fields that were explicitly provided', async () => {
    const existing = makeExistingPart();
    partRepository.findByIdAndCompanyId.mockResolvedValue(existing);

    const result = await useCase.execute({
      id: existing.id,
      companyId: 'company-1',
      name: 'Filtro de Oleo Y',
    });

    expect(result.name).toBe('Filtro de Oleo Y');
    expect(result.currentStock).toBe(15);
    expect(result.criticalityLevel).toBe(3);
  });

  it('applies a currentStock of zero instead of silently skipping it', async () => {
    const existing = makeExistingPart();
    partRepository.findByIdAndCompanyId.mockResolvedValue(existing);

    const result = await useCase.execute({
      id: existing.id,
      companyId: 'company-1',
      currentStock: 0,
    });

    expect(result.currentStock).toBe(0);
  });

  it('applies an averageDailySales of zero instead of silently skipping it', async () => {
    const existing = makeExistingPart();
    partRepository.findByIdAndCompanyId.mockResolvedValue(existing);

    const result = await useCase.execute({
      id: existing.id,
      companyId: 'company-1',
      averageDailySales: 0,
    });

    expect(result.averageDailySales).toBe(0);
  });

  it('persists the updated entity via the repository', async () => {
    const existing = makeExistingPart();
    partRepository.findByIdAndCompanyId.mockResolvedValue(existing);

    await useCase.execute({
      id: existing.id,
      companyId: 'company-1',
      criticalityLevel: 5,
    });

    expect(partRepository.update).toHaveBeenCalledWith(existing);
    expect(existing.criticalityLevel).toBe(5);
  });

  it("invalidates the restock priorities cache entry for the part's company", async () => {
    const existing = makeExistingPart();
    partRepository.findByIdAndCompanyId.mockResolvedValue(existing);

    await useCase.execute({
      id: existing.id,
      companyId: 'company-1',
      criticalityLevel: 5,
    });

    expect(cacheAdapter.del).toHaveBeenCalledWith(
      PartPriorityService.cacheKeyFor('company-1'),
    );
  });
});
