import { apiRequest } from "./client";
import type { RestockPrioritiesResponse } from "../types";

export function getRestockPriorities(page = 1, limit = 20) {
  return apiRequest<RestockPrioritiesResponse>(
    `/restock/priorities?page=${page}&limit=${limit}`,
  );
}
