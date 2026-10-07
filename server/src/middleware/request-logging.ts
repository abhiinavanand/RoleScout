import type { RequestHandler } from "express";

export const requestLoggingMiddleware: RequestHandler = (request, response, next) => {
  const startedAt = Date.now();
  response.on("finish", () => {
    console.info(JSON.stringify({
      event: "http_request",
      requestId: response.locals.requestId,
      method: request.method,
      path: request.originalUrl,
      statusCode: response.statusCode,
      durationMs: Date.now() - startedAt,
    }));
  });
  next();
};
