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
import { CreatePartUseCase } from 'src/application/usecases/parts/create-part.usecase';
import { DeletePartUseCase } from 'src/application/usecases/parts/delete-part.usecase';
import { GetAllPartsUseCase } from 'src/application/usecases/parts/get-all-parts.usecase';
import { GetPartByIdUseCase } from 'src/application/usecases/parts/get-part-by-id.usecase';
import { UpdatePartUseCase } from 'src/application/usecases/parts/update-part.usecase';
import { RoleEnum } from 'src/domain/enums/role.enum';
import { Roles } from 'src/infra/decorators/roles.decorator';
import { JwtAuthGuard } from 'src/infra/guards/jwt-auth.guard';
import { RolesGuard } from 'src/infra/guards/roles.guard';
import { CreatePartDto } from 'src/presentation/dtos/parts/create-part.dto';
import { FindPartsQueryDto } from 'src/presentation/dtos/parts/find-parts-query.dto';
import { PartResponseDto } from 'src/presentation/dtos/parts/part-response.dto';
import { UpdatePartDto } from 'src/presentation/dtos/parts/update-part.dto';
import type { AuthenticatedRequest } from 'src/shared/interfaces/authenticated-request.interface';

@ApiTags('parts')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('parts')
export class PartsController {
  constructor(
    private readonly createPartUseCase: CreatePartUseCase,
    private readonly getAllPartsUseCase: GetAllPartsUseCase,
    private readonly getPartByIdUseCase: GetPartByIdUseCase,
    private readonly updatePartUseCase: UpdatePartUseCase,
    private readonly deletePartUseCase: DeletePartUseCase,
  ) {}

  @Post()
  @Roles(RoleEnum.ADMIN)
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create a part' })
  @ApiResponse({ status: HttpStatus.CREATED, type: PartResponseDto })
  async create(
    @Body() dto: CreatePartDto,
    @Req() request: AuthenticatedRequest,
  ): Promise<PartResponseDto> {
    const part = await this.createPartUseCase.execute({
      ...dto,
      companyId: request.user.companyId,
    });
    return PartResponseDto.fromEntity(part);
  }

  @Get()
  @ApiOperation({ summary: 'List parts, optionally filtered by category' })
  @ApiResponse({ status: HttpStatus.OK, type: [PartResponseDto] })
  async findAll(
    @Query() query: FindPartsQueryDto,
    @Req() request: AuthenticatedRequest,
  ): Promise<PartResponseDto[]> {
    const parts = await this.getAllPartsUseCase.execute({
      companyId: request.user.companyId,
      category: query.category,
    });
    return parts.map((part) => PartResponseDto.fromEntity(part));
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a part by id' })
  @ApiResponse({ status: HttpStatus.OK, type: PartResponseDto })
  async findById(
    @Param('id', ParseUUIDPipe) id: string,
    @Req() request: AuthenticatedRequest,
  ): Promise<PartResponseDto> {
    const part = await this.getPartByIdUseCase.execute({
      id,
      companyId: request.user.companyId,
    });
    return PartResponseDto.fromEntity(part);
  }

  @Put(':id')
  @Roles(RoleEnum.ADMIN)
  @ApiOperation({ summary: 'Update a part' })
  @ApiResponse({ status: HttpStatus.OK, type: PartResponseDto })
  async update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdatePartDto,
    @Req() request: AuthenticatedRequest,
  ): Promise<PartResponseDto> {
    const part = await this.updatePartUseCase.execute({
      id,
      companyId: request.user.companyId,
      ...dto,
    });
    return PartResponseDto.fromEntity(part);
  }

  @Delete(':id')
  @Roles(RoleEnum.ADMIN)
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete a part' })
  @ApiResponse({ status: HttpStatus.NO_CONTENT })
  async delete(
    @Param('id', ParseUUIDPipe) id: string,
    @Req() request: AuthenticatedRequest,
  ): Promise<void> {
    await this.deletePartUseCase.execute({
      id,
      companyId: request.user.companyId,
    });
  }
}
