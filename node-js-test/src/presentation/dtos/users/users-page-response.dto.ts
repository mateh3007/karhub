import { ApiProperty } from '@nestjs/swagger';
import { UserEntity } from 'src/domain/entities/user.entity';
import { IPaginatedResult } from 'src/shared/interfaces/pagination.interface';
import { UserResponseDto } from './user-response.dto';

export class UsersPageResponseDto {
  @ApiProperty({ type: [UserResponseDto] })
  data: UserResponseDto[];

  @ApiProperty()
  total: number;

  @ApiProperty()
  page: number;

  @ApiProperty()
  limit: number;

  @ApiProperty()
  totalPages: number;

  static fromPaginatedResult(
    result: IPaginatedResult<UserEntity>,
  ): UsersPageResponseDto {
    const dto = new UsersPageResponseDto();
    dto.data = result.data.map((user) => UserResponseDto.fromEntity(user));
    dto.total = result.total;
    dto.page = result.page;
    dto.limit = result.limit;
    dto.totalPages = result.totalPages;
    return dto;
  }
}
