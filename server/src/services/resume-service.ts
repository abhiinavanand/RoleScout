import type { Resume } from "@prisma/client";
import { prisma } from "../config/database.js";
import { AppError } from "../utils/errors.js";
import { candidateProfileSchema, type CandidateProfileData } from "../types/profile.js";
import { extractResumeText, type ResumeFormat } from "./resume-text-extractor.js";
import { parseResumeDeterministically } from "./resume-fallback-parser.js";
import { normalizeSkills } from "./skill-normalizer.js";
import { OpenAiResumeParser, type ResumeParserProvider } from "./resume-ai-parser.js";
import { LocalStorageProvider, type StorageProvider } from "./storage-provider.js";
import { ResumeRepository } from "../repositories/resume-repository.js";

const MIME_TYPES = new Map<string, ResumeFormat>([["application/pdf", "pdf"], ["application/vnd.openxmlformats-officedocument.wordprocessingml.document", "docx"]]);

interface ResumeStore {
  create(userId: string, input: { originalFileName: string; mimeType: string; fileSize: number; storageKey: string; extractedText: string }): Promise<Resume>;
  latestForUser(userId: string): Promise<Resume | null>;
  findForUser(id: string, userId: string): Promise<Resume | null>;
  deleteForUser(id: string, userId: string): Promise<boolean>;
  saveProfile(userId: string, profile: CandidateProfileData): Promise<unknown>;
  markProcessing(id: string): Promise<Resume>;
  markCompleted(id: string): Promise<Resume>;
  markFailed(id: string, errorCode: string): Promise<Resume>;
  findById(id: string): Promise<Resume | null>;
  updateExtractedText(id: string, extractedText: string): Promise<Resume>;
}

export class ResumeService {
  constructor(
    private readonly repository: ResumeStore = new ResumeRepository(prisma),
    private readonly storage: StorageProvider = new LocalStorageProvider(),
    private readonly aiParser: ResumeParserProvider = new OpenAiResumeParser(),
    private readonly textExtractor: typeof extractResumeText = extractResumeText,
  ) {}

  async upload(userId: string, file: Express.Multer.File): Promise<{ resume: Resume; profile: CandidateProfileData }> {
    const resume = await this.uploadPending(userId, file);
    const profile = await this.process(resume.id);
    return { resume, profile };
  }

  async uploadPending(userId: string, file: Express.Multer.File): Promise<Resume> {
    const format = this.validateFile(file);
    const storageKey = await this.storage.save(file.buffer, format);
    try {
      const resume = await this.repository.create(userId, {
        originalFileName: sanitizeFileName(file.originalname),
        mimeType: file.mimetype,
        fileSize: file.size,
        storageKey,
        extractedText: "",
      });
      return resume;
    } catch (error) {
      await this.storage.remove(storageKey);
      throw error;
    }
  }

  async process(resumeId: string): Promise<CandidateProfileData> {
    const resume = await this.repository.findById(resumeId);
    if (!resume) throw new AppError(404, "RESUME_NOT_FOUND", "Resume not found.");
    await this.repository.markProcessing(resumeId);
    const format = resume.mimeType === "application/pdf" ? "pdf" : "docx";
    const extractedText = await this.textExtractor(await this.storage.read(resume.storageKey), format);
    const profile = await this.parse(extractedText);
    await this.repository.updateExtractedText(resumeId, extractedText);
    await this.repository.saveProfile(resume.userId, profile);
    await this.repository.markCompleted(resumeId);
    return profile;
  }

  async reparse(userId: string): Promise<CandidateProfileData> {
    const resume = await this.repository.latestForUser(userId);
    if (!resume) throw new AppError(404, "RESUME_NOT_FOUND", "Upload a resume before reparsing your profile.");
    const profile = await this.parse(resume.extractedText);
    await this.repository.saveProfile(userId, profile);
    return profile;
  }

  async delete(userId: string, resumeId: string): Promise<void> {
    const resume = await this.repository.findForUser(resumeId, userId);
    if (!resume) throw new AppError(404, "RESUME_NOT_FOUND", "Resume not found.");
    const deleted = await this.repository.deleteForUser(resumeId, userId);
    if (!deleted) throw new AppError(404, "RESUME_NOT_FOUND", "Resume not found.");
    await this.storage.remove(resume.storageKey);
  }

  private async parse(text: string): Promise<CandidateProfileData> {
    try {
      const parsed = await this.aiParser.parseResume(text);
      return candidateProfileSchema.parse({ ...parsed, skills: normalizeSkills(parsed.skills) });
    } catch (error) {
      console.warn(JSON.stringify({ event: "resume_ai_fallback", reason: error instanceof Error ? error.message : "unknown_error" }));
      return parseResumeDeterministically(text);
    }
  }

  private validateFile(file: Express.Multer.File): ResumeFormat {
    if (!file) throw new AppError(400, "RESUME_REQUIRED", "A PDF or DOCX resume is required.");
    const extension = file.originalname.toLowerCase().split(".").pop();
    const format = MIME_TYPES.get(file.mimetype);
    if (!format || extension !== format) throw new AppError(400, "UNSUPPORTED_RESUME", "Only valid PDF and DOCX resumes are supported.");
    if (format === "pdf" && file.buffer.subarray(0, 5).toString() !== "%PDF-") throw new AppError(400, "INVALID_RESUME_FILE", "The uploaded file is not a valid PDF.");
    if (format === "docx" && file.buffer.subarray(0, 2).toString() !== "PK") throw new AppError(400, "INVALID_RESUME_FILE", "The uploaded file is not a valid DOCX.");
    return format;
  }
}

function sanitizeFileName(fileName: string): string {
  return fileName.replace(/[/\\]/g, "_").replace(/[^\w.-]/g, "_").replace(/^\.+/, "").slice(0, 255) || "resume";
}
