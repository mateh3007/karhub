export interface IUpdatePart {
  id: string;
  companyId: string;
  name?: string;
  category?: string;
  currentStock?: number;
  minimumStock?: number;
  averageDailySales?: number;
  leadTimeDays?: number;
  unitCost?: number;
  criticalityLevel?: number;
}
