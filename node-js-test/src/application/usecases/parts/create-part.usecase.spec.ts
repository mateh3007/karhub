import { PartPriorityService } from 'src/application/services/part-priority.service';
import { CacheAdapter } from 'src/domain/adapters/cache.adapter';
import { PartEntity } from 'src/domain/entities/part.entity';
import { PartRepository } from 'src/domain/repositories/part.repository';
import { CreatePartUseCase } from './create-part.usecase';

describe('CreatePartUseCase', () => {
  let partRepository: jest.Mocked<PartRepository>;
  let cacheAdapter: jest.Mocked<CacheAdapter>;
  let useCase: CreatePartUseCase;

  beforeEach(() => {
    partRepository = {
      create: jest.fn(),
    } as unknown as jest.Mocked<PartRepository>;
    cacheAdapter = {
      get: jest.fn(),
      set: jest.fn(),
      del: jest.fn(),
    };
    useCase = new CreatePartUseCase(partRepository, cacheAdapter);
  });

  it('builds a PartEntity from the input and persists it via the repository', async () => {
    const input = {
      name: 'Filtro de Oleo X',
      category: 'engine',
      currentStock: 15,
      minimumStock: 20,
      averageDailySales: 4,
      leadTimeDays: 5,
      unitCost: 18.5,
      criticalityLevel: 3,
      companyId: 'company-1',
    };
    const created = new PartEntity(input);
    partRepository.create.mockResolvedValue(created);

    const result = await useCase.execute(input);

    expect(partRepository.create).toHaveBeenCalledTimes(1);
    const persistedEntity = partRepository.create.mock.calls[0][0];
    expect(persistedEntity).toBeInstanceOf(PartEntity);
    expect(persistedEntity.name).toBe(input.name);
    expect(persistedEntity.companyId).toBe(input.companyId);
    expect(result).toBe(created);
  });

  it("invalidates the restock priorities cache entry for the part's company", async () => {
    const input = {
      name: 'Filtro de Oleo X',
      category: 'engine',
      currentStock: 15,
      minimumStock: 20,
      averageDailySales: 4,
      leadTimeDays: 5,
      unitCost: 18.5,
      criticalityLevel: 3,
      companyId: 'company-1',
    };
    partRepository.create.mockResolvedValue(new PartEntity(input));

    await useCase.execute(input);

    expect(cacheAdapter.del).toHaveBeenCalledWith(
      PartPriorityService.cacheKeyFor('company-1'),
    );
  });
});
