import { apiRequest } from "./client";
import type { PaginatedResult, Part, PartInput } from "../types";

export interface ListPartsParams {
  page?: number;
  limit?: number;
  category?: string;
}

export function listParts(params: ListPartsParams = {}) {
  const query = new URLSearchParams();
  if (params.page) query.set("page", String(params.page));
  if (params.limit) query.set("limit", String(params.limit));
  if (params.category) query.set("category", params.category);
  const qs = query.toString();
  return apiRequest<PaginatedResult<Part>>(`/parts${qs ? `?${qs}` : ""}`);
}

export function createPart(input: PartInput) {
  return apiRequest<Part>("/parts", { method: "POST", body: input });
}

export function updatePart(id: string, input: Partial<PartInput>) {
  return apiRequest<Part>(`/parts/${id}`, { method: "PUT", body: input });
}

export function deletePart(id: string) {
  return apiRequest<void>(`/parts/${id}`, { method: "DELETE" });
}
