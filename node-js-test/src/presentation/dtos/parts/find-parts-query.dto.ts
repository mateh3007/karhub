import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString } from 'class-validator';

export class FindPartsQueryDto {
  @ApiPropertyOptional({ example: 'engine' })
  @IsOptional()
  @IsString()
  category?: string;
}
