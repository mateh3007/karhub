import { apiRequest } from "./client";
import type { RegisterPayload } from "../types";

export interface LoginResponse {
  accessToken: string;
}

export function login(email: string, password: string) {
  return apiRequest<LoginResponse>("/auth/login", {
    method: "POST",
    body: { email, password },
    auth: false,
  });
}

export function register(payload: RegisterPayload) {
  return apiRequest<unknown>("/auth/register", {
    method: "POST",
    body: payload,
    auth: false,
  });
}
