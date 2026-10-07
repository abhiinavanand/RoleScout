import type { User } from "@prisma/client";

export type PublicUser = Pick<User, "id" | "name" | "email" | "createdAt">;

export type AuthenticatedRequest = Express.Request & {
  user: PublicUser;
};

declare global {
  namespace Express {
    interface Request {
      user?: PublicUser;
    }
  }
}
