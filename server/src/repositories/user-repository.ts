import type { PrismaClient, User } from "@prisma/client";

export class UserRepository {
  constructor(private readonly database: PrismaClient) {}

  findByEmail(email: string): Promise<User | null> {
    return this.database.user.findUnique({ where: { email } });
  }

  findById(id: string): Promise<User | null> {
    return this.database.user.findUnique({ where: { id } });
  }

  create(input: { name: string; email: string; passwordHash: string }): Promise<User> {
    return this.database.user.create({ data: input });
  }

  revokeSessions(userId: string): Promise<User> {
    return this.database.user.update({
      where: { id: userId },
      data: { sessionVersion: { increment: 1 } },
    });
  }
}
