import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Post,
  Put,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { CreateUserUseCase } from 'src/application/usecases/users/create-user.usecase';
import { DeleteUserUseCase } from 'src/application/usecases/users/delete-user.usecase';
import { GetAllUsersUseCase } from 'src/application/usecases/users/get-all-users.usecase';
import { GetUserByIdUseCase } from 'src/application/usecases/users/get-user-by-id.usecase';
import { UpdateUserUseCase } from 'src/application/usecases/users/update-user.usecase';
import { RoleEnum } from 'src/domain/enums/role.enum';
import { Roles } from 'src/infra/decorators/roles.decorator';
import { JwtAuthGuard } from 'src/infra/guards/jwt-auth.guard';
import { RolesGuard } from 'src/infra/guards/roles.guard';
import { CreateUserDto } from 'src/presentation/dtos/users/create-user.dto';
import { FindUsersQueryDto } from 'src/presentation/dtos/users/find-users-query.dto';
import { UpdateUserDto } from 'src/presentation/dtos/users/update-user.dto';
import { UserResponseDto } from 'src/presentation/dtos/users/user-response.dto';
import { UsersPageResponseDto } from 'src/presentation/dtos/users/users-page-response.dto';
import type { AuthenticatedRequest } from 'src/shared/interfaces/authenticated-request.interface';

@ApiTags('users')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('users')
export class UsersController {
  constructor(
    private readonly createUserUseCase: CreateUserUseCase,
    private readonly getAllUsersUseCase: GetAllUsersUseCase,
    private readonly getUserByIdUseCase: GetUserByIdUseCase,
    private readonly updateUserUseCase: UpdateUserUseCase,
    private readonly deleteUserUseCase: DeleteUserUseCase,
  ) {}

  @Post()
  @Roles(RoleEnum.ADMIN)
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create a user' })
  @ApiResponse({ status: HttpStatus.CREATED, type: UserResponseDto })
  async create(
    @Body() dto: CreateUserDto,
    @Req() request: AuthenticatedRequest,
  ): Promise<UserResponseDto> {
    const user = await this.createUserUseCase.execute({
      ...dto,
      companyId: request.user.companyId,
    });
    return UserResponseDto.fromEntity(user);
  }

  @Get()
  @ApiOperation({ summary: "List the caller's company users, paginated" })
  @ApiResponse({ status: HttpStatus.OK, type: UsersPageResponseDto })
  async findAll(
    @Query() query: FindUsersQueryDto,
    @Req() request: AuthenticatedRequest,
  ): Promise<UsersPageResponseDto> {
    const result = await this.getAllUsersUseCase.execute({
      companyId: request.user.companyId,
      page: query.page,
      limit: query.limit,
    });
    return UsersPageResponseDto.fromPaginatedResult(result);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a user by id' })
  @ApiResponse({ status: HttpStatus.OK, type: UserResponseDto })
  async findById(
    @Param('id', ParseUUIDPipe) id: string,
    @Req() request: AuthenticatedRequest,
  ): Promise<UserResponseDto> {
    const user = await this.getUserByIdUseCase.execute({
      id,
      companyId: request.user.companyId,
    });
    return UserResponseDto.fromEntity(user);
  }

  @Put(':id')
  @Roles(RoleEnum.ADMIN)
  @ApiOperation({ summary: 'Update a user' })
  @ApiResponse({ status: HttpStatus.OK, type: UserResponseDto })
  async update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateUserDto,
    @Req() request: AuthenticatedRequest,
  ): Promise<UserResponseDto> {
    const user = await this.updateUserUseCase.execute({
      id,
      companyId: request.user.companyId,
      ...dto,
    });
    return UserResponseDto.fromEntity(user);
  }

  @Delete(':id')
  @Roles(RoleEnum.ADMIN)
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete a user' })
  @ApiResponse({ status: HttpStatus.NO_CONTENT })
  async delete(
    @Param('id', ParseUUIDPipe) id: string,
    @Req() request: AuthenticatedRequest,
  ): Promise<void> {
    await this.deleteUserUseCase.execute({
      id,
      companyId: request.user.companyId,
    });
  }
}
