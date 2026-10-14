import { sql } from "drizzle-orm";
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./schema";

export function createDb(url: string) {
  const client = postgres(url, { max: 10 });
  const db = drizzle(client, { schema, casing: "snake_case" });
  return {
    db,
    async ping() {
      await db.execute(sql`select 1`);
    },
    close: () => client.end(),
  };
}

export type Database = ReturnType<typeof createDb>["db"];
