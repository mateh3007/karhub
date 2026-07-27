import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString } from 'class-validator';
import { PaginationQueryDto } from 'src/presentation/dtos/shared/pagination-query.dto';

export class FindPartsQueryDto extends PaginationQueryDto {
  @ApiPropertyOptional({ example: 'engine' })
  @IsOptional()
  @IsString()
  category?: string;
}
