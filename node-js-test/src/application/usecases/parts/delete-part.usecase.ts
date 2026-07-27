import { Injectable, NotFoundException } from '@nestjs/common';
import { PartPriorityService } from 'src/application/services/part-priority.service';
import { CacheAdapter } from 'src/domain/adapters/cache.adapter';
import { IPartScope } from 'src/domain/interfaces/parts/part-scope.interface';
import { PartRepository } from 'src/domain/repositories/part.repository';
import { BaseUsecase } from 'src/shared/bases/base.usecase';

@Injectable()
export class DeletePartUseCase extends BaseUsecase<IPartScope, void> {
  constructor(
    private readonly partRepository: PartRepository,
    private readonly cacheAdapter: CacheAdapter,
  ) {
    super();
  }

  async execute(data: IPartScope): Promise<void> {
    const part = await this.partRepository.findByIdAndCompanyId(
      data.id,
      data.companyId,
    );
    if (!part) {
      throw new NotFoundException('Part not found');
    }

    await this.partRepository.delete(data.id);
    await this.cacheAdapter.del(
      PartPriorityService.cacheKeyFor(data.companyId),
    );
  }
}
