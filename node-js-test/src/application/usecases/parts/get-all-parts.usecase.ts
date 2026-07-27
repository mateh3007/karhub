import { Injectable } from '@nestjs/common';
import { PartEntity } from 'src/domain/entities/part.entity';
import { IFindAllParts } from 'src/domain/interfaces/parts/find-all-parts.interface';
import { PartRepository } from 'src/domain/repositories/part.repository';
import { BaseUsecase } from 'src/shared/bases/base.usecase';
import { IPaginatedResult } from 'src/shared/interfaces/pagination.interface';

@Injectable()
export class GetAllPartsUseCase extends BaseUsecase<
  IFindAllParts,
  IPaginatedResult<PartEntity>
> {
  constructor(private readonly partRepository: PartRepository) {
    super();
  }

  async execute(data: IFindAllParts): Promise<IPaginatedResult<PartEntity>> {
    return this.partRepository.findPageByCompanyId(
      data.companyId,
      { page: data.page, limit: data.limit },
      data.category,
    );
  }
}
