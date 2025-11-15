// lib/types.ts

export type UserRole = "client" | "vet" | "registrar" | "admin";

export interface AppUser {
  id: string;
  email: string | null;
  role: UserRole;
}
