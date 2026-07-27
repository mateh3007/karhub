import { Controller, Get, HttpStatus, Req, UseGuards } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { GetRestockPrioritiesUseCase } from 'src/application/usecases/parts/get-restock-priorities.usecase';
import { JwtAuthGuard } from 'src/infra/guards/jwt-auth.guard';
import { RolesGuard } from 'src/infra/guards/roles.guard';
import { RestockPrioritiesResponseDto } from 'src/presentation/dtos/parts/restock-priorities-response.dto';
import { RestockPriorityItemDto } from 'src/presentation/dtos/parts/restock-priority-item.dto';
import type { AuthenticatedRequest } from 'src/shared/interfaces/authenticated-request.interface';

@ApiTags('restock')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('restock')
export class RestockController {
  constructor(
    private readonly getRestockPrioritiesUseCase: GetRestockPrioritiesUseCase,
  ) {}

  @Get('priorities')
  @ApiOperation({
    summary: 'List parts that need restocking, ordered by urgency',
  })
  @ApiResponse({ status: HttpStatus.OK, type: RestockPrioritiesResponseDto })
  async priorities(
    @Req() request: AuthenticatedRequest,
  ): Promise<RestockPrioritiesResponseDto> {
    const parts = await this.getRestockPrioritiesUseCase.execute({
      companyId: request.user.companyId,
    });

    return {
      priorities: parts.map((part) => RestockPriorityItemDto.fromEntity(part)),
    };
  }
}
