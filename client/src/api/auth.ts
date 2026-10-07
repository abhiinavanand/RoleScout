import { apiRequest } from "./client";

export type User = { id: string; name: string; email: string; createdAt: string };
type AuthResponse = { user: User };

export const getCurrentUser = () => apiRequest<AuthResponse>("/auth/me");
export const register = (input: { name: string; email: string; password: string }) =>
  apiRequest<AuthResponse>("/auth/register", { method: "POST", body: JSON.stringify(input) });
export const login = (input: { email: string; password: string }) =>
  apiRequest<AuthResponse>("/auth/login", { method: "POST", body: JSON.stringify(input) });
export const logout = () => apiRequest<{ loggedOut: boolean }>("/auth/logout", { method: "POST" });
