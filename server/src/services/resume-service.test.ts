import { describe, expect, it } from "vitest";
import type { Resume } from "@prisma/client";
import { ResumeService } from "./resume-service.js";
import type { CandidateProfileData } from "../types/profile.js";

const storedResume = (input: Partial<Resume> = {}): Resume => ({
  id: "resume_1",
  userId: "user_1",
  originalFileName: "resume.pdf",
  mimeType: "application/pdf",
  fileSize: 12,
  storageKey: "safe-key.pdf",
  extractedText: "Ada ada@example.com ReactJS",
  createdAt: new Date(),
  updatedAt: new Date(),
  processingStatus: "PENDING",
  processingStartedAt: null,
  processingCompletedAt: null,
  processingFailedAt: null,
  processingErrorCode: null,
  ...input,
});

function dependencies() {
  const saved: { resume?: Resume; profile?: CandidateProfileData; removed?: string } = {};
  const repository = {
    create: async (userId: string, input: Omit<Resume, "id" | "userId" | "createdAt" | "updatedAt">) => {
      saved.resume = storedResume({ userId, ...input });
      return saved.resume;
    },
    latestForUser: async () => saved.resume ?? null,
    findForUser: async () => saved.resume ?? null,
    deleteForUser: async () => true,
    saveProfile: async (_userId: string, profile: CandidateProfileData) => { saved.profile = profile; return profile; },
    markProcessing: async () => saved.resume!,
    markCompleted: async () => saved.resume!,
    markFailed: async () => saved.resume!,
    findById: async () => saved.resume ?? null,
    updateExtractedText: async () => saved.resume!,
  };
  const storage = {
    save: async (_contents: Buffer, extension: "pdf" | "docx") => `safe-key.${extension}`,
    read: async () => Buffer.from("%PDF-"),
    remove: async (storageKey: string) => { saved.removed = storageKey; },
  };
  const aiParser = { parseResume: async () => { throw new Error("provider unavailable"); } };
  const extractor = async () => "Ada Lovelace\nSenior Node.js Engineer\nada@example.com\nReactJS";
  return { saved, repository, storage, aiParser, extractor };
}

describe("ResumeService", () => {
  it("processes a valid PDF and falls back when AI is unavailable", async () => {
    const dependenciesForTest = dependencies();
    const service = new ResumeService(dependenciesForTest.repository, dependenciesForTest.storage, dependenciesForTest.aiParser, dependenciesForTest.extractor);
    const result = await service.upload("user_1", { originalname: "../resume.pdf", mimetype: "application/pdf", size: 12, buffer: Buffer.from("%PDF-") } as Express.Multer.File);
    expect(result.profile.email).toBe("ada@example.com");
    expect(result.profile.skills).toContain("React");
    expect(result.resume.originalFileName).toBe("_resume.pdf");
  });

  it("accepts DOCX signatures and rejects unsupported files", async () => {
    const dependenciesForTest = dependencies();
    const service = new ResumeService(dependenciesForTest.repository, dependenciesForTest.storage, dependenciesForTest.aiParser, dependenciesForTest.extractor);
    await expect(service.upload("user_1", { originalname: "resume.docx", mimetype: "application/vnd.openxmlformats-officedocument.wordprocessingml.document", size: 12, buffer: Buffer.from("PK") } as Express.Multer.File)).resolves.toBeTruthy();
    await expect(service.upload("user_1", { originalname: "resume.exe", mimetype: "application/octet-stream", size: 12, buffer: Buffer.from("MZ") } as Express.Multer.File)).rejects.toMatchObject({ code: "UNSUPPORTED_RESUME" });
  });
});
