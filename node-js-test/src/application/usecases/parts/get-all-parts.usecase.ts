import { Injectable } from '@nestjs/common';
import { PartEntity } from 'src/domain/entities/part.entity';
import { IFindAllParts } from 'src/domain/interfaces/parts/find-all-parts.interface';
import { PartRepository } from 'src/domain/repositories/part.repository';
import { BaseUsecase } from 'src/shared/bases/base.usecase';

@Injectable()
export class GetAllPartsUseCase extends BaseUsecase<
  IFindAllParts,
  PartEntity[]
> {
  constructor(private readonly partRepository: PartRepository) {
    super();
  }

  async execute(data: IFindAllParts): Promise<PartEntity[]> {
    return this.partRepository.findByCompanyId(data.companyId, data.category);
  }
}
