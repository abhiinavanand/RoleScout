import { PDFParse } from "pdf-parse";
import mammoth from "mammoth";
import { AppError } from "../utils/errors.js";

export type ResumeFormat = "pdf" | "docx";

export async function extractResumeText(buffer: Buffer, format: ResumeFormat): Promise<string> {
  try {
    const textResult = format === "pdf"
      ? await extractPdfText(buffer)
      : await mammoth.extractRawText({ buffer });
    const rawText = "text" in textResult ? textResult.text : "";
    const text = rawText.replace(/\r\n?/g, "\n").replace(/[ \t]+/g, " ").replace(/\n{3,}/g, "\n\n").trim();
    if (!text) throw new AppError(422, "EMPTY_RESUME", "The resume did not contain readable text.");
    return text.slice(0, 100_000);
  } catch (error) {
    if (error instanceof AppError) throw error;
    throw new AppError(422, "RESUME_EXTRACTION_FAILED", "The resume could not be read. Please upload a valid PDF or DOCX file.");
  }

  async function extractPdfText(buffer: Buffer): Promise<{ text: string }> {
    const parser = new PDFParse({ data: buffer });
    try {
      return await parser.getText();
    } finally {
      await parser.destroy();
    }
  }
}
