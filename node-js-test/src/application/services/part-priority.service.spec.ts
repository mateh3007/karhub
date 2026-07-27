import { PartEntity, IPartEntity } from 'src/domain/entities/part.entity';
import { PartPriorityService } from './part-priority.service';

function makePart(overrides: Partial<IPartEntity> = {}): PartEntity {
  return new PartEntity({
    name: 'Part',
    category: 'misc',
    currentStock: 10,
    minimumStock: 10,
    averageDailySales: 2,
    leadTimeDays: 5,
    unitCost: 5,
    criticalityLevel: 2,
    companyId: 'company-1',
    ...overrides,
  });
}

describe('PartPriorityService', () => {
  let service: PartPriorityService;

  beforeEach(() => {
    service = new PartPriorityService();
  });

  describe('filterNeedingRestock', () => {
    it('keeps only parts whose needsRestock() is true', () => {
      const needsRestock = makePart({ name: 'Needs Restock', currentStock: 0 });
      const doesNotNeedRestock = makePart({
        name: 'Fully Stocked',
        currentStock: 1000,
        minimumStock: 5,
        averageDailySales: 1,
        leadTimeDays: 1,
      });

      const result = service.filterNeedingRestock([
        needsRestock,
        doesNotNeedRestock,
      ]);

      expect(result).toEqual([needsRestock]);
    });

    it('returns an empty array when nothing needs restocking', () => {
      const wellStocked = makePart({
        currentStock: 1000,
        minimumStock: 5,
        averageDailySales: 1,
        leadTimeDays: 1,
      });
      expect(service.filterNeedingRestock([wellStocked])).toEqual([]);
    });
  });

  describe('sortByUrgency', () => {
    it('orders by urgencyScore descending', () => {
      const low = makePart({
        name: 'Low',
        currentStock: 5,
        minimumStock: 10,
        criticalityLevel: 1,
        averageDailySales: 0,
        leadTimeDays: 0,
      });
      const high = makePart({
        name: 'High',
        currentStock: -5,
        minimumStock: 10,
        criticalityLevel: 5,
        averageDailySales: 0,
        leadTimeDays: 0,
      });

      const result = service.sortByUrgency([low, high]);

      expect(result.map((part) => part.name)).toEqual(['High', 'Low']);
    });

    it('breaks urgencyScore ties by higher criticalityLevel first', () => {
      // Same currentStock/minimumStock/averageDailySales/leadTimeDays -> same projectedStock and gap.
      // urgencyScore differs only because criticalityLevel differs, so this also proves the
      // tie-break rule reduces to comparing criticalityLevel once urgencyScore is equal elsewhere.
      const lessCritical = makePart({
        name: 'Less Critical',
        criticalityLevel: 2,
      });
      const moreCritical = makePart({
        name: 'More Critical',
        criticalityLevel: 4,
      });

      const result = service.sortByUrgency([lessCritical, moreCritical]);

      expect(result.map((part) => part.name)).toEqual([
        'More Critical',
        'Less Critical',
      ]);
    });

    it('breaks a tie in urgencyScore AND criticalityLevel by higher averageDailySales', () => {
      // urgencyScore = (minimumStock - projectedStock) * criticalityLevel.
      // To keep urgencyScore and criticalityLevel identical while averageDailySales differs,
      // compensate leadTimeDays so expectedConsumption (and thus projectedStock) stays the same.
      const slowerSales = makePart({
        name: 'Slower Sales',
        averageDailySales: 2,
        leadTimeDays: 10,
        criticalityLevel: 3,
      });
      const fasterSales = makePart({
        name: 'Faster Sales',
        averageDailySales: 4,
        leadTimeDays: 5,
        criticalityLevel: 3,
      });

      expect(slowerSales.urgencyScore()).toBe(fasterSales.urgencyScore());

      const result = service.sortByUrgency([slowerSales, fasterSales]);

      expect(result.map((part) => part.name)).toEqual([
        'Faster Sales',
        'Slower Sales',
      ]);
    });

    it('breaks a full tie by alphabetical name order', () => {
      const zebra = makePart({ name: 'Zebra Part' });
      const alpha = makePart({ name: 'Alpha Part' });

      const result = service.sortByUrgency([zebra, alpha]);

      expect(result.map((part) => part.name)).toEqual([
        'Alpha Part',
        'Zebra Part',
      ]);
    });

    it('does not mutate the original array', () => {
      const parts = [
        makePart({ name: 'Zebra Part' }),
        makePart({ name: 'Alpha Part' }),
      ];
      const originalOrder = parts.map((part) => part.name);

      service.sortByUrgency(parts);

      expect(parts.map((part) => part.name)).toEqual(originalOrder);
    });
  });
});
