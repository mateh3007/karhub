import { Injectable, NotFoundException } from '@nestjs/common';
import { PartEntity } from 'src/domain/entities/part.entity';
import { IPartScope } from 'src/domain/interfaces/parts/part-scope.interface';
import { PartRepository } from 'src/domain/repositories/part.repository';
import { BaseUsecase } from 'src/shared/bases/base.usecase';

@Injectable()
export class GetPartByIdUseCase extends BaseUsecase<IPartScope, PartEntity> {
  constructor(private readonly partRepository: PartRepository) {
    super();
  }

  async execute(data: IPartScope): Promise<PartEntity> {
    const part = await this.partRepository.findByIdAndCompanyId(
      data.id,
      data.companyId,
    );
    if (!part) {
      throw new NotFoundException('Part not found');
    }

    return part;
  }
}
