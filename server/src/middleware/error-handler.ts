import type { ErrorRequestHandler } from "express";
import { ZodError } from "zod";
import { MulterError } from "multer";
import { AppError } from "../utils/errors.js";

export const errorHandler: ErrorRequestHandler = (error, request, response, _next) => {
  if (error instanceof ZodError) {
    response.status(400).json({
      success: false,
      error: { code: "INVALID_REQUEST", message: "The request contains invalid values.", details: error.flatten().fieldErrors },
    });
    return;
  }
  if (error instanceof MulterError && error.code === "LIMIT_FILE_SIZE") {
    response.status(413).json({ success: false, error: { code: "RESUME_TOO_LARGE", message: "The resume exceeds the configured upload limit." } });
    return;
  }
  const appError = error instanceof AppError ? error : null;
  if (!appError) {
    console.error(JSON.stringify({ event: "unhandled_error", requestId: response.locals.requestId, message: error instanceof Error ? error.message : "Unknown error" }));
  }
  response.status(appError?.statusCode ?? 500).json({
    success: false,
    error: {
      code: appError?.code ?? "INTERNAL_ERROR",
      message: appError?.message ?? "An unexpected error occurred.",
    },
  });
};
