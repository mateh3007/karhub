import { Injectable } from '@nestjs/common';
import { PartPriorityService } from 'src/application/services/part-priority.service';
import { CacheAdapter } from 'src/domain/adapters/cache.adapter';
import { PartEntity } from 'src/domain/entities/part.entity';
import { ICreatePart } from 'src/domain/interfaces/parts/create-part.interface';
import { PartRepository } from 'src/domain/repositories/part.repository';
import { BaseUsecase } from 'src/shared/bases/base.usecase';

@Injectable()
export class CreatePartUseCase extends BaseUsecase<ICreatePart, PartEntity> {
  constructor(
    private readonly partRepository: PartRepository,
    private readonly cacheAdapter: CacheAdapter,
  ) {
    super();
  }

  async execute(data: ICreatePart): Promise<PartEntity> {
    const part = new PartEntity(data);
    const created = await this.partRepository.create(part);
    await this.cacheAdapter.del(
      PartPriorityService.cacheKeyFor(data.companyId),
    );
    return created;
  }
}
