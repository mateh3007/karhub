import { Injectable } from '@nestjs/common';
import { PartEntity } from 'src/domain/entities/part.entity';

@Injectable()
export class PartPriorityService {
  static cacheKeyFor(companyId: string): string {
    return `restock-priorities:${companyId}`;
  }

  filterNeedingRestock(parts: PartEntity[]): PartEntity[] {
    return parts.filter((part) => part.needsRestock());
  }

  sortByUrgency(parts: PartEntity[]): PartEntity[] {
    return [...parts].sort((a, b) => this.compare(a, b));
  }

  private compare(a: PartEntity, b: PartEntity): number {
    if (b.urgencyScore() !== a.urgencyScore()) {
      return b.urgencyScore() - a.urgencyScore();
    }

    if (b.criticalityLevel !== a.criticalityLevel) {
      return b.criticalityLevel - a.criticalityLevel;
    }

    if (b.averageDailySales !== a.averageDailySales) {
      return b.averageDailySales - a.averageDailySales;
    }

    return a.name.localeCompare(b.name);
  }
}
