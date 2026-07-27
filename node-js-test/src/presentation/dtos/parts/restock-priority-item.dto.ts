import { ApiProperty } from '@nestjs/swagger';
import { PartEntity } from 'src/domain/entities/part.entity';

export class RestockPriorityItemDto {
  @ApiProperty()
  partId: string;

  @ApiProperty()
  name: string;

  @ApiProperty()
  currentStock: number;

  @ApiProperty()
  projectedStock: number;

  @ApiProperty()
  minimumStock: number;

  @ApiProperty()
  urgencyScore: number;

  static fromEntity(entity: PartEntity): RestockPriorityItemDto {
    const dto = new RestockPriorityItemDto();
    dto.partId = entity.id;
    dto.name = entity.name;
    dto.currentStock = entity.currentStock;
    dto.projectedStock = entity.projectedStock();
    dto.minimumStock = entity.minimumStock;
    dto.urgencyScore = entity.urgencyScore();
    return dto;
  }
}
