import { Queue, QueueEvents } from "bullmq";

export const AI_QUEUE_NAME = "applywise-ai";
let queue;
let queueEvents;

export function aiQueueEnabled() {
  return Boolean(process.env.REDIS_URL?.trim());
}

export function aiQueueConnection() {
  const url = process.env.REDIS_URL?.trim();
  if (!url) {
    const error = new Error("Background AI processing is unavailable because REDIS_URL is not configured");
    error.status = 503;
    throw error;
  }
  return { url, maxRetriesPerRequest: null, enableReadyCheck: true };
}

export function getAiQueue() {
  if (!queue) queue = new Queue(AI_QUEUE_NAME, { connection: aiQueueConnection(), defaultJobOptions: {
    attempts: 3,
    backoff: { type: "exponential", delay: 1_000 },
    removeOnComplete: { age: 3_600, count: 500 },
    removeOnFail: { age: 86_400, count: 1_000 }
  } });
  return queue;
}

export async function enqueueAiJob(userId, application, kind, extra = {}) {
  const job = await getAiQueue().add(kind, {
    userId,
    kind,
    extra,
    application: {
      id: application.id,
      company: application.company,
      role: application.role,
      dateApplied: application.dateApplied.toISOString(),
      status: application.status,
      notes: application.notes || ""
    }
  });
  return job.id;
}

export async function ownedAiJob(jobId, userId) {
  const job = await getAiQueue().getJob(jobId);
  return job?.data?.userId === userId ? job : null;
}

export function attachAiQueueEvents(io) {
  if (!aiQueueEnabled() || queueEvents) return queueEvents;
  queueEvents = new QueueEvents(AI_QUEUE_NAME, { connection: aiQueueConnection() });
  queueEvents.on("completed", async ({ jobId }) => {
    try {
      const job = await getAiQueue().getJob(jobId);
      if (!job?.data?.userId) return;
      io.to(`user:${job.data.userId}`).emit("ai:completed", { jobId, kind: job.data.kind, applicationId: job.data.application.id });
    } catch (error) { console.warn("Could not emit AI completion event", { jobId, message: error.message }); }
  });
  queueEvents.on("failed", async ({ jobId, failedReason }) => {
    try {
      const job = await getAiQueue().getJob(jobId);
      if (!job?.data?.userId) return;
      io.to(`user:${job.data.userId}`).emit("ai:failed", { jobId, kind: job.data.kind, applicationId: job.data.application.id, error: "AI generation failed", reason: failedReason });
    } catch (error) { console.warn("Could not emit AI failure event", { jobId, message: error.message }); }
  });
  queueEvents.waitUntilReady().then(() => console.info("AI queue events connected")).catch((error) => console.warn("AI queue events unavailable", { message: error.message }));
  return queueEvents;
}
