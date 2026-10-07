import type { PrismaClient } from "@prisma/client";

export class SavedJobRepository {
  constructor(private readonly database: PrismaClient) {}
  listForUser(userId: string) { return this.database.savedJob.findMany({ where: { userId }, include: { job: true }, orderBy: { createdAt: "desc" } }); }
  async save(userId: string, jobId: string) {
    return this.database.savedJob.create({ data: { userId, jobId }, include: { job: true } });
  }
  deleteForUser(userId: string, jobId: string) { return this.database.savedJob.deleteMany({ where: { userId, jobId } }); }
  findForUser(userId: string, jobId: string) { return this.database.savedJob.findUnique({ where: { userId_jobId: { userId, jobId } } }); }
  listJobIdsForUser(userId: string, jobIds: string[]): Promise<string[]> {
    return this.database.savedJob.findMany({ where: { userId, jobId: { in: jobIds } }, select: { jobId: true } }).then((items) => items.map((item) => item.jobId));
  }
}
