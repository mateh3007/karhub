import { ApiProperty } from '@nestjs/swagger';
import { PartEntity } from 'src/domain/entities/part.entity';
import { IPaginatedResult } from 'src/shared/interfaces/pagination.interface';
import { PartResponseDto } from './part-response.dto';

export class PartsPageResponseDto {
  @ApiProperty({ type: [PartResponseDto] })
  data: PartResponseDto[];

  @ApiProperty()
  total: number;

  @ApiProperty()
  page: number;

  @ApiProperty()
  limit: number;

  @ApiProperty()
  totalPages: number;

  static fromPaginatedResult(
    result: IPaginatedResult<PartEntity>,
  ): PartsPageResponseDto {
    const dto = new PartsPageResponseDto();
    dto.data = result.data.map((part) => PartResponseDto.fromEntity(part));
    dto.total = result.total;
    dto.page = result.page;
    dto.limit = result.limit;
    dto.totalPages = result.totalPages;
    return dto;
  }
}
