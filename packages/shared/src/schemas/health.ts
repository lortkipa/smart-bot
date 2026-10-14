import { z } from "zod";

export const HealthResponse = z.object({
  status: z.enum(["ok", "degraded"]),
  version: z.string(),
  database: z.enum(["ok", "error"]),
  time: z.string(),
});
export type HealthResponse = z.infer<typeof HealthResponse>;
