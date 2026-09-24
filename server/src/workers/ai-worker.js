import "dotenv/config";
import { Worker } from "bullmq";
import { AI_QUEUE_NAME, aiQueueConnection } from "../services/ai-queue.js";
import { generateQueuedAi } from "../services/queued-ai.js";

function positiveInteger(value, fallback, maximum) {
  const parsed = Number(value);
  return Number.isInteger(parsed) && parsed > 0 ? Math.min(parsed, maximum) : fallback;
}

const concurrency = positiveInteger(process.env.AI_WORKER_CONCURRENCY, 4, 20);
const rateLimit = positiveInteger(process.env.AI_WORKER_RATE_LIMIT, 20, 200);
const worker = new Worker(AI_QUEUE_NAME, async (job) => {
  if (!['follow-up', 'tips'].includes(job.data.kind)) throw new Error("Unsupported AI job type");
  await job.updateProgress(10);
  const output = await generateQueuedAi(job.data.application, job.data.kind);
  await job.updateProgress(100);
  return output;
}, {
  connection: aiQueueConnection(),
  concurrency,
  limiter: { max: rateLimit, duration: 60_000 }
});

worker.on("completed", (job) => console.info("AI job completed", { jobId: job.id, kind: job.name }));
worker.on("failed", (job, error) => console.warn("AI job failed", { jobId: job?.id, kind: job?.name, message: error.message }));
worker.on("error", (error) => console.error("AI worker error", error));

for (const signal of ["SIGINT", "SIGTERM"]) {
  process.once(signal, async () => {
    await worker.close();
    process.exit(0);
  });
}

console.info("AI worker started", { queue: AI_QUEUE_NAME, concurrency });
