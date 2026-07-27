import { ApiProperty } from '@nestjs/swagger';
import { PartEntity } from 'src/domain/entities/part.entity';

export class PartResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  name: string;

  @ApiProperty()
  category: string;

  @ApiProperty()
  currentStock: number;

  @ApiProperty()
  minimumStock: number;

  @ApiProperty()
  averageDailySales: number;

  @ApiProperty()
  leadTimeDays: number;

  @ApiProperty()
  unitCost: number;

  @ApiProperty()
  criticalityLevel: number;

  @ApiProperty()
  companyId: string;

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  updatedAt: Date;

  static fromEntity(entity: PartEntity): PartResponseDto {
    const dto = new PartResponseDto();
    dto.id = entity.id;
    dto.name = entity.name;
    dto.category = entity.category;
    dto.currentStock = entity.currentStock;
    dto.minimumStock = entity.minimumStock;
    dto.averageDailySales = entity.averageDailySales;
    dto.leadTimeDays = entity.leadTimeDays;
    dto.unitCost = entity.unitCost;
    dto.criticalityLevel = entity.criticalityLevel;
    dto.companyId = entity.companyId;
    dto.createdAt = entity.createdAt;
    dto.updatedAt = entity.updatedAt;
    return dto;
  }
}
