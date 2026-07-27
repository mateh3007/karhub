import { ApiProperty } from '@nestjs/swagger';
import { RestockPriorityItemDto } from './restock-priority-item.dto';

export class RestockPrioritiesResponseDto {
  @ApiProperty({ type: [RestockPriorityItemDto] })
  priorities: RestockPriorityItemDto[];
}
