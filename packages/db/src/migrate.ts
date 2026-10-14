import { fileURLToPath } from "node:url";
import { drizzle } from "drizzle-orm/postgres-js";
import { migrate } from "drizzle-orm/postgres-js/migrator";
import postgres from "postgres";

/** Default location of the generated SQL migrations (packages/db/drizzle). */
export const defaultMigrationsFolder = fileURLToPath(new URL("../drizzle", import.meta.url));

export async function runMigrations(url: string, migrationsFolder = defaultMigrationsFolder) {
  const client = postgres(url, { max: 1, onnotice: () => {} });
  try {
    await migrate(drizzle(client), { migrationsFolder });
  } finally {
    await client.end();
  }
}
