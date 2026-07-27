export interface ICreatePart {
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
