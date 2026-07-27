import { Injectable } from '@nestjs/common';
import { PartPriorityService } from 'src/application/services/part-priority.service';
import { CacheAdapter } from 'src/domain/adapters/cache.adapter';
import { IPartEntity, PartEntity } from 'src/domain/entities/part.entity';
import { IGetRestockPriorities } from 'src/domain/interfaces/parts/get-restock-priorities.interface';
import { PartRepository } from 'src/domain/repositories/part.repository';
import { BaseUsecase } from 'src/shared/bases/base.usecase';

const DEFAULT_CACHE_TTL_SECONDS = 30;

@Injectable()
export class GetRestockPrioritiesUseCase extends BaseUsecase<
  IGetRestockPriorities,
  PartEntity[]
> {
  private readonly ttlSeconds = Number(
    process.env.RESTOCK_PRIORITIES_CACHE_TTL_SECONDS ??
      DEFAULT_CACHE_TTL_SECONDS,
  );

  constructor(
    private readonly partRepository: PartRepository,
    private readonly partPriorityService: PartPriorityService,
    private readonly cacheAdapter: CacheAdapter,
  ) {
    super();
  }

  async execute(data: IGetRestockPriorities): Promise<PartEntity[]> {
    const cacheKey = PartPriorityService.cacheKeyFor(data.companyId);

    const cached = await this.cacheAdapter.get<IPartEntity[]>(cacheKey);
    if (cached) {
      return cached.map((part) => PartEntity.fromPlain(part));
    }

    const parts = await this.partRepository.findByCompanyId(data.companyId);
    const needingRestock = this.partPriorityService.filterNeedingRestock(parts);
    const prioritized = this.partPriorityService.sortByUrgency(needingRestock);

    await this.cacheAdapter.set(cacheKey, prioritized, this.ttlSeconds);
    return prioritized;
  }
}
