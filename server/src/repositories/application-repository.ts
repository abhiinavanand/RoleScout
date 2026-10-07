import type { Application, ApplicationStatus, Prisma, PrismaClient } from "@prisma/client";

export class ApplicationRepository {
  constructor(private readonly database: PrismaClient) {}

  findByUserAndJob(userId: string, jobId: string): Promise<Application | null> {
    return this.database.application.findUnique({ where: { userId_jobId: { userId, jobId } } });
  }

  create(userId: string, input: { jobId: string; status: ApplicationStatus; appliedAt?: Date | null; notes?: string | null }): Promise<Application> {
    return this.database.application.create({ data: { userId, ...input } });
  }

  findByIdForUser(id: string, userId: string) {
    return this.database.application.findFirst({ where: { id, userId }, include: { job: true } });
  }

  findByUser(userId: string, filters: { status?: ApplicationStatus; page: number; pageSize: number }) {
    const where: Prisma.ApplicationWhereInput = { userId, status: filters.status };
    return Promise.all([
      this.database.application.findMany({ where, include: { job: true }, orderBy: [{ updatedAt: "desc" }, { id: "desc" }], skip: (filters.page - 1) * filters.pageSize, take: filters.pageSize }),
      this.database.application.count({ where }),
    ]);
  }

  updateForUser(id: string, userId: string, data: { status?: ApplicationStatus; appliedAt?: Date | null; notes?: string | null }) {
    return this.database.application.updateMany({ where: { id, userId }, data }).then(async (result) => result.count ? this.findByIdForUser(id, userId) : null);
  }

  deleteForUser(id: string, userId: string): Promise<boolean> {
    return this.database.application.deleteMany({ where: { id, userId } }).then((result) => result.count === 1);
  }

  listStatusesForUser(userId: string, jobIds: string[]): Promise<Array<{ jobId: string; status: ApplicationStatus }>> {
    return this.database.application.findMany({ where: { userId, jobId: { in: jobIds } }, select: { jobId: true, status: true } });
  }
}
