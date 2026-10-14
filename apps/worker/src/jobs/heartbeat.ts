import type { PgBoss } from "pg-boss";

export const HEARTBEAT_QUEUE = "heartbeat";

/**
 * Placeholder job proving the queue works end to end. Agent runs
 * (workspace bots, task agents) will be registered the same way.
 */
export async function registerHeartbeat(boss: PgBoss) {
  await boss.createQueue(HEARTBEAT_QUEUE);
  await boss.work(HEARTBEAT_QUEUE, async ([job]) => {
    console.log(`[worker] heartbeat job ${job?.id} processed`);
  });
  await boss.schedule(HEARTBEAT_QUEUE, "*/5 * * * *");
}
