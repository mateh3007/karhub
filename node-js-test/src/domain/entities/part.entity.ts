import { BaseEntity, IBaseEntity } from 'src/shared/bases/base.entity';

export interface IPartEntity extends IBaseEntity {
  name: string;
  category: string;
  currentStock: number;
  minimumStock: number;
  averageDailySales: number;
  leadTimeDays: number;
  unitCost: number;
  criticalityLevel: number;
  companyId: string;
}

export class PartEntity extends BaseEntity {
  private _name: string;
  private _category: string;
  private _currentStock: number;
  private _minimumStock: number;
  private _averageDailySales: number;
  private _leadTimeDays: number;
  private _unitCost: number;
  private _criticalityLevel: number;
  private _companyId: string;

  constructor(data: IPartEntity) {
    super(data);
    this._name = data.name;
    this._category = data.category;
    this._currentStock = data.currentStock;
    this._minimumStock = data.minimumStock;
    this._averageDailySales = data.averageDailySales;
    this._leadTimeDays = data.leadTimeDays;
    this._unitCost = data.unitCost;
    this._criticalityLevel = data.criticalityLevel;
    this._companyId = data.companyId;
  }

  get name(): string {
    return this._name;
  }

  get category(): string {
    return this._category;
  }

  get currentStock(): number {
    return this._currentStock;
  }

  get minimumStock(): number {
    return this._minimumStock;
  }

  get averageDailySales(): number {
    return this._averageDailySales;
  }

  get leadTimeDays(): number {
    return this._leadTimeDays;
  }

  get unitCost(): number {
    return this._unitCost;
  }

  get criticalityLevel(): number {
    return this._criticalityLevel;
  }

  get companyId(): string {
    return this._companyId;
  }

  set name(value: string) {
    this._name = value;
  }

  set category(value: string) {
    this._category = value;
  }

  set currentStock(value: number) {
    this._currentStock = value;
  }

  set minimumStock(value: number) {
    this._minimumStock = value;
  }

  set averageDailySales(value: number) {
    this._averageDailySales = value;
  }

  set leadTimeDays(value: number) {
    this._leadTimeDays = value;
  }

  set unitCost(value: number) {
    this._unitCost = value;
  }

  set criticalityLevel(value: number) {
    this._criticalityLevel = value;
  }

  expectedConsumption(): number {
    return this._averageDailySales * this._leadTimeDays;
  }

  projectedStock(): number {
    return this._currentStock - this.expectedConsumption();
  }

  needsRestock(): boolean {
    return this.projectedStock() < this._minimumStock;
  }

  urgencyScore(): number {
    return (
      (this._minimumStock - this.projectedStock()) * this._criticalityLevel
    );
  }

  toJSON(): IPartEntity {
    return {
      id: this.id,
      name: this._name,
      category: this._category,
      currentStock: this._currentStock,
      minimumStock: this._minimumStock,
      averageDailySales: this._averageDailySales,
      leadTimeDays: this._leadTimeDays,
      unitCost: this._unitCost,
      criticalityLevel: this._criticalityLevel,
      companyId: this._companyId,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt,
      deletedAt: this.deletedAt,
    };
  }

  static fromPlain(data: IPartEntity): PartEntity {
    return new PartEntity({
      ...data,
      createdAt: data.createdAt ? new Date(data.createdAt) : undefined,
      updatedAt: data.updatedAt ? new Date(data.updatedAt) : undefined,
      deletedAt: data.deletedAt ? new Date(data.deletedAt) : null,
    });
  }
}
