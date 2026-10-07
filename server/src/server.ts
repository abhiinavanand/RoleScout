import { app } from "./app.js";
import { connectRedis } from "./config/redis.js";
import { env } from "./config/env.js";
import { prisma } from "./config/database.js";
import { redisClient } from "./config/redis.js";
import { closeQueues } from "./queues/queue-config.js";
import { closeQueueEvents } from "./queues/queue-events.js";

await connectRedis();
const server = app.listen(env.PORT, () => {
  console.info(JSON.stringify({ event: "server_started", port: env.PORT }));
});

let shuttingDown = false;
async function shutdown(signal: string): Promise<void> {
  if (shuttingDown) return;
  shuttingDown = true;
  const closeHttpServer = new Promise<void>((resolve) => server.close(() => resolve()));
  const timeout = new Promise<void>((resolve) => setTimeout(resolve, env.SHUTDOWN_TIMEOUT_MS));
  await Promise.race([closeHttpServer, timeout]);
  try {
    await closeQueueEvents();
    await closeQueues();
    if (redisClient.isOpen) await redisClient.quit();
    await prisma.$disconnect();
    console.info(JSON.stringify({ event: "server_shutdown_complete", signal }));
    process.exit(0);
  } catch (error) {
    console.error(JSON.stringify({ event: "server_shutdown_failed", signal, message: error instanceof Error ? error.message : "unknown_error" }));
    process.exit(1);
  }
}

process.once("SIGTERM", () => void shutdown("SIGTERM"));
process.once("SIGINT", () => void shutdown("SIGINT"));
