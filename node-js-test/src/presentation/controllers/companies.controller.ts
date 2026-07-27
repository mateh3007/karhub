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
  Req,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { CreateCompanyUseCase } from 'src/application/usecases/companies/create-company.usecase';
import { DeleteCompanyUseCase } from 'src/application/usecases/companies/delete-company.usecase';
import { GetAllCompaniesUseCase } from 'src/application/usecases/companies/get-all-companies.usecase';
import { GetCompanyByIdUseCase } from 'src/application/usecases/companies/get-company-by-id.usecase';
import { UpdateCompanyUseCase } from 'src/application/usecases/companies/update-company.usecase';
import { RoleEnum } from 'src/domain/enums/role.enum';
import { Roles } from 'src/infra/decorators/roles.decorator';
import { JwtAuthGuard } from 'src/infra/guards/jwt-auth.guard';
import { RolesGuard } from 'src/infra/guards/roles.guard';
import { CompanyResponseDto } from 'src/presentation/dtos/companies/company-response.dto';
import { CreateCompanyDto } from 'src/presentation/dtos/companies/create-company.dto';
import { UpdateCompanyDto } from 'src/presentation/dtos/companies/update-company.dto';
import type { AuthenticatedRequest } from 'src/shared/interfaces/authenticated-request.interface';

@ApiTags('companies')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('companies')
export class CompaniesController {
  constructor(
    private readonly createCompanyUseCase: CreateCompanyUseCase,
    private readonly getAllCompaniesUseCase: GetAllCompaniesUseCase,
    private readonly getCompanyByIdUseCase: GetCompanyByIdUseCase,
    private readonly updateCompanyUseCase: UpdateCompanyUseCase,
    private readonly deleteCompanyUseCase: DeleteCompanyUseCase,
  ) {}

  @Post()
  @Roles(RoleEnum.ADMIN)
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create a company' })
  @ApiResponse({ status: HttpStatus.CREATED, type: CompanyResponseDto })
  async create(@Body() dto: CreateCompanyDto): Promise<CompanyResponseDto> {
    const company = await this.createCompanyUseCase.execute(dto);
    return CompanyResponseDto.fromEntity(company);
  }

  @Get()
  @ApiOperation({ summary: "Get the caller's own company" })
  @ApiResponse({ status: HttpStatus.OK, type: [CompanyResponseDto] })
  async findAll(
    @Req() request: AuthenticatedRequest,
  ): Promise<CompanyResponseDto[]> {
    const companies = await this.getAllCompaniesUseCase.execute({
      companyId: request.user.companyId,
    });
    return companies.map((company) => CompanyResponseDto.fromEntity(company));
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a company by id' })
  @ApiResponse({ status: HttpStatus.OK, type: CompanyResponseDto })
  async findById(
    @Param('id', ParseUUIDPipe) id: string,
    @Req() request: AuthenticatedRequest,
  ): Promise<CompanyResponseDto> {
    const company = await this.getCompanyByIdUseCase.execute({
      id,
      companyId: request.user.companyId,
    });
    return CompanyResponseDto.fromEntity(company);
  }

  @Put(':id')
  @Roles(RoleEnum.ADMIN)
  @ApiOperation({ summary: 'Update a company' })
  @ApiResponse({ status: HttpStatus.OK, type: CompanyResponseDto })
  async update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateCompanyDto,
    @Req() request: AuthenticatedRequest,
  ): Promise<CompanyResponseDto> {
    const company = await this.updateCompanyUseCase.execute({
      id,
      companyId: request.user.companyId,
      ...dto,
    });
    return CompanyResponseDto.fromEntity(company);
  }

  @Delete(':id')
  @Roles(RoleEnum.ADMIN)
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete a company' })
  @ApiResponse({ status: HttpStatus.NO_CONTENT })
  async delete(
    @Param('id', ParseUUIDPipe) id: string,
    @Req() request: AuthenticatedRequest,
  ): Promise<void> {
    await this.deleteCompanyUseCase.execute({
      id,
      companyId: request.user.companyId,
    });
  }
}
