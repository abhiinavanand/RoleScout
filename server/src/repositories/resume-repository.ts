import type { CandidateProfile, PrismaClient, Resume } from "@prisma/client";
import type { CandidateProfileData } from "../types/profile.js";

export class ResumeRepository {
  constructor(private readonly database: PrismaClient) {}

  listForUser(userId: string): Promise<Resume[]> {
    return this.database.resume.findMany({ where: { userId }, orderBy: { createdAt: "desc" } });
  }

  findForUser(id: string, userId: string): Promise<Resume | null> {
    return this.database.resume.findFirst({ where: { id, userId } });
  }

  findById(id: string): Promise<Resume | null> {
    return this.database.resume.findUnique({ where: { id } });
  }

  latestForUser(userId: string): Promise<Resume | null> {
    return this.database.resume.findFirst({ where: { userId }, orderBy: { createdAt: "desc" } });
  }

  markProcessing(id: string): Promise<Resume> {
    return this.database.resume.update({ where: { id }, data: { processingStatus: "PROCESSING", processingStartedAt: new Date(), processingErrorCode: null } });
  }

  markCompleted(id: string): Promise<Resume> {
    return this.database.resume.update({ where: { id }, data: { processingStatus: "COMPLETED", processingCompletedAt: new Date(), processingFailedAt: null, processingErrorCode: null } });
  }

  markFailed(id: string, errorCode: string): Promise<Resume> {
    return this.database.resume.update({ where: { id }, data: { processingStatus: "FAILED", processingFailedAt: new Date(), processingErrorCode: errorCode } });
  }

  updateExtractedText(id: string, extractedText: string): Promise<Resume> {
    return this.database.resume.update({ where: { id }, data: { extractedText } });
  }

  create(userId: string, input: { originalFileName: string; mimeType: string; fileSize: number; storageKey: string; extractedText: string }): Promise<Resume> {
    return this.database.resume.create({ data: { userId, ...input } });
  }

  async deleteForUser(id: string, userId: string): Promise<boolean> {
    const result = await this.database.resume.deleteMany({ where: { id, userId } });
    return result.count === 1;
  }

  getProfile(userId: string): Promise<CandidateProfile | null> {
    return this.database.candidateProfile.findUnique({ where: { userId } });
  }

  saveProfile(userId: string, profile: CandidateProfileData): Promise<CandidateProfile> {
    return this.database.candidateProfile.upsert({
      where: { userId },
      create: { userId, ...profile },
      update: { ...profile },
    });
  }
}
