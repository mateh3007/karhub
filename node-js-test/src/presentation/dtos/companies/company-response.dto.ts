import { ApiProperty } from '@nestjs/swagger';
import { CompanyEntity } from 'src/domain/entities/company.entity';

export class CompanyResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  cnpj: string;

  @ApiProperty()
  corporateName: string;

  @ApiProperty()
  tradeName: string;

  @ApiProperty()
  contactEmail: string;

  @ApiProperty()
  phone: string;

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  updatedAt: Date;

  static fromEntity(entity: CompanyEntity): CompanyResponseDto {
    const dto = new CompanyResponseDto();
    dto.id = entity.id;
    dto.cnpj = entity.cnpj;
    dto.corporateName = entity.corporateName;
    dto.tradeName = entity.tradeName;
    dto.contactEmail = entity.contactEmail;
    dto.phone = entity.phone;
    dto.createdAt = entity.createdAt;
    dto.updatedAt = entity.updatedAt;
    return dto;
  }
}
