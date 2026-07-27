export type Role = "ADMIN" | "USER";

export interface JwtPayload {
  sub: string;
  email: string;
  role: Role;
  companyId: string;
  iat: number;
  exp: number;
}

export interface Part {
  id: string;
  name: string;
  category: string;
  currentStock: number;
  minimumStock: number;
  averageDailySales: number;
  leadTimeDays: number;
  unitCost: number;
  criticalityLevel: number;
  companyId: string;
  createdAt: string;
  updatedAt: string;
}

export interface PartInput {
  name: string;
  category: string;
  currentStock: number;
  minimumStock: number;
  averageDailySales: number;
  leadTimeDays: number;
  unitCost: number;
  criticalityLevel: number;
}

export interface PaginatedResult<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface RestockPriorityItem {
  partId: string;
  name: string;
  currentStock: number;
  projectedStock: number;
  minimumStock: number;
  urgencyScore: number;
}

export interface RestockPrioritiesResponse {
  priorities: RestockPriorityItem[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface RegisterPayload {
  corporateName: string;
  tradeName: string;
  cnpj: string;
  phone: string;
  contactEmail: string;
  adminName: string;
  adminPassword: string;
}
