import { connectRedis } from "../config/redis.js";
import { redisClient } from "../config/redis.js";
import { prisma } from "../config/database.js";
import { closeQueues } from "../queues/queue-config.js";
import { closeQueueEvents } from "../queues/queue-events.js";
import { closeWorkers, createWorkers } from "./worker-runtime.js";
import { env } from "../config/env.js";

await connectRedis();
const workers = createWorkers();
console.info(JSON.stringify({ event: "worker_started" }));

let shuttingDown = false;
async function shutdown(signal: string): Promise<void> {
  if (shuttingDown) return;
  shuttingDown = true;
  console.info(JSON.stringify({ event: "worker_shutdown_started", signal }));
  const shutdownTasks = (async () => {
    await closeWorkers(workers);
    await closeQueueEvents();
    await closeQueues();
    if (redisClient.isOpen) await redisClient.quit();
    await prisma.$disconnect();
  })();
  await Promise.race([shutdownTasks, new Promise<void>((resolve) => setTimeout(resolve, env.SHUTDOWN_TIMEOUT_MS))]);
  process.exit(0);
}

process.once("SIGTERM", () => void shutdown("SIGTERM"));
process.once("SIGINT", () => void shutdown("SIGINT"));
