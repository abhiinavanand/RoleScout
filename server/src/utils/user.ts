import type { User } from "@prisma/client";
import type { PublicUser } from "../types/auth.js";

export function toPublicUser(user: User): PublicUser {
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    createdAt: user.createdAt,
  };
}
