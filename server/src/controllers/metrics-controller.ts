import type { RequestHandler } from "express";
import { renderMetrics } from "../observability/metrics.js";

export const getMetrics: RequestHandler = (_request, response) => {
  response.type("text/plain; version=0.0.4").send(renderMetrics());
};
