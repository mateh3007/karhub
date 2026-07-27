import { ApiProperty } from '@nestjs/swagger';
import {
  IsInt,
  IsNotEmpty,
  IsNumber,
  IsString,
  Max,
  Min,
} from 'class-validator';
import { ICreatePart } from 'src/domain/interfaces/parts/create-part.interface';

export class CreatePartDto implements Omit<ICreatePart, 'companyId'> {
  @ApiProperty({ example: 'Filtro de Oleo X' })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({ example: 'engine' })
  @IsString()
  @IsNotEmpty()
  category: string;

  @ApiProperty({ example: 15 })
  @IsInt()
  @Min(0)
  currentStock: number;

  @ApiProperty({ example: 20 })
  @IsInt()
  @Min(0)
  minimumStock: number;

  @ApiProperty({ example: 4, description: 'Average units sold per day' })
  @IsNumber()
  @Min(0)
  averageDailySales: number;

  @ApiProperty({ example: 5, description: 'Supplier lead time, in days' })
  @IsInt()
  @Min(0)
  leadTimeDays: number;

  @ApiProperty({ example: 18.5 })
  @IsNumber()
  @Min(0)
  unitCost: number;

  @ApiProperty({ example: 3, minimum: 1, maximum: 5 })
  @IsInt()
  @Min(1)
  @Max(5)
  criticalityLevel: number;
}
