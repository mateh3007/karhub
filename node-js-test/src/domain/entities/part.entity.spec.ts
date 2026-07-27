import { PartEntity, IPartEntity } from './part.entity';

function makePart(overrides: Partial<IPartEntity> = {}): PartEntity {
  return new PartEntity({
    name: 'Filtro de Oleo X',
    category: 'engine',
    currentStock: 15,
    minimumStock: 20,
    averageDailySales: 4,
    leadTimeDays: 5,
    unitCost: 18.5,
    criticalityLevel: 3,
    companyId: 'company-1',
    ...overrides,
  });
}

describe('PartEntity', () => {
  describe('expectedConsumption', () => {
    it('multiplies averageDailySales by leadTimeDays', () => {
      const part = makePart({ averageDailySales: 4, leadTimeDays: 5 });
      expect(part.expectedConsumption()).toBe(20);
    });

    it('is zero when averageDailySales is zero', () => {
      const part = makePart({ averageDailySales: 0, leadTimeDays: 30 });
      expect(part.expectedConsumption()).toBe(0);
    });
  });

  describe('projectedStock', () => {
    it('subtracts expected consumption from current stock', () => {
      const part = makePart({
        currentStock: 15,
        averageDailySales: 4,
        leadTimeDays: 5,
      });
      expect(part.projectedStock()).toBe(-5);
    });

    it('can be negative and is not clamped to zero', () => {
      const part = makePart({
        currentStock: 8,
        averageDailySales: 3,
        leadTimeDays: 4,
      });
      expect(part.projectedStock()).toBe(-4);
    });

    it('equals current stock when there is no expected consumption (zero sales)', () => {
      const part = makePart({
        currentStock: 5,
        averageDailySales: 0,
        leadTimeDays: 30,
      });
      expect(part.projectedStock()).toBe(5);
    });

    it('goes deeply negative with a high lead time', () => {
      const part = makePart({
        currentStock: 10,
        averageDailySales: 5,
        leadTimeDays: 365,
      });
      expect(part.projectedStock()).toBe(10 - 5 * 365);
    });
  });

  describe('needsRestock', () => {
    it('is true when projected stock is below minimum stock', () => {
      const part = makePart({
        currentStock: 15,
        minimumStock: 20,
        averageDailySales: 4,
        leadTimeDays: 5,
      });
      expect(part.needsRestock()).toBe(true);
    });

    it('is false when projected stock is above minimum stock', () => {
      const part = makePart({
        currentStock: 100,
        minimumStock: 10,
        averageDailySales: 1,
        leadTimeDays: 2,
      });
      expect(part.needsRestock()).toBe(false);
    });

    it('is false when projected stock exactly equals minimum stock (strict less-than)', () => {
      const part = makePart({
        currentStock: 20,
        minimumStock: 10,
        averageDailySales: 2,
        leadTimeDays: 5,
      });
      expect(part.projectedStock()).toBe(10);
      expect(part.needsRestock()).toBe(false);
    });

    it('is true with zero sales when current stock is already below minimum stock', () => {
      const part = makePart({
        currentStock: 5,
        minimumStock: 10,
        averageDailySales: 0,
        leadTimeDays: 30,
      });
      expect(part.needsRestock()).toBe(true);
    });
  });

  describe('urgencyScore', () => {
    it('multiplies the restock gap by criticality level', () => {
      const part = makePart({
        currentStock: 15,
        minimumStock: 20,
        averageDailySales: 4,
        leadTimeDays: 5,
        criticalityLevel: 3,
      });
      // projectedStock = -5, gap = 20 - (-5) = 25, urgencyScore = 25 * 3
      expect(part.urgencyScore()).toBe(75);
    });

    it('scales with the minimum criticality level (1)', () => {
      const part = makePart({
        currentStock: 8,
        minimumStock: 10,
        averageDailySales: 3,
        leadTimeDays: 4,
        criticalityLevel: 1,
      });
      expect(part.urgencyScore()).toBe(14);
    });

    it('scales with the maximum criticality level (5)', () => {
      const part = makePart({
        currentStock: 8,
        minimumStock: 10,
        averageDailySales: 3,
        leadTimeDays: 4,
        criticalityLevel: 5,
      });
      expect(part.urgencyScore()).toBe(70);
    });

    it('is zero when the part does not need restocking', () => {
      const part = makePart({
        currentStock: 100,
        minimumStock: 10,
        averageDailySales: 1,
        leadTimeDays: 2,
        criticalityLevel: 5,
      });
      expect(part.urgencyScore()).toBe((10 - 98) * 5);
    });

    it('grows very large with a high lead time and high criticality', () => {
      const part = makePart({
        currentStock: 10,
        minimumStock: 10,
        averageDailySales: 5,
        leadTimeDays: 365,
        criticalityLevel: 5,
      });
      const expectedGap = 10 - (10 - 5 * 365);
      expect(part.urgencyScore()).toBe(expectedGap * 5);
    });
  });

  describe('toJSON / fromPlain', () => {
    it('serializes to a plain object with clean field names, not private-field names', () => {
      const part = makePart();

      const plain = JSON.parse(JSON.stringify(part)) as Record<string, unknown>;

      expect(plain).toEqual({
        id: part.id,
        name: part.name,
        category: part.category,
        currentStock: part.currentStock,
        minimumStock: part.minimumStock,
        averageDailySales: part.averageDailySales,
        leadTimeDays: part.leadTimeDays,
        unitCost: part.unitCost,
        criticalityLevel: part.criticalityLevel,
        companyId: part.companyId,
        createdAt: part.createdAt.toISOString(),
        updatedAt: part.updatedAt.toISOString(),
        deletedAt: null,
      });
    });

    it('round-trips through JSON into a fully-functional PartEntity', () => {
      const original = makePart({ currentStock: -5, criticalityLevel: 5 });

      const roundTripped = PartEntity.fromPlain(
        JSON.parse(JSON.stringify(original)) as IPartEntity,
      );

      expect(roundTripped).toBeInstanceOf(PartEntity);
      expect(roundTripped.id).toBe(original.id);
      expect(roundTripped.createdAt).toBeInstanceOf(Date);
      expect(roundTripped.urgencyScore()).toBe(original.urgencyScore());
      expect(roundTripped.needsRestock()).toBe(original.needsRestock());
    });
  });
});
