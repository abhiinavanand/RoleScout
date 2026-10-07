import type { RequestHandler } from "express";
import { prisma } from "../config/database.js";
import { redisClient } from "../config/redis.js";

export const getHealth: RequestHandler = (_request, response) => {
  response.json({ success: true, data: { status: "healthy" } });
};

export const getReadiness: RequestHandler = async (_request, response) => {
  const database = await prisma.$queryRaw`SELECT 1`.then(() => "ready").catch(() => "not_ready");
  const redis = redisClient.isReady ? "ready" : "not_ready";
  const healthy = database === "ready" && redis === "ready";
  response.status(healthy ? 200 : 503).json({ success: healthy, data: { status: healthy ? "healthy" : "not_ready", database, redis } });
};
