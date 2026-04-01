import { Pool } from "pg";
import { appEnv } from "@/lib/env";

let pool: Pool | null = null;

export function getPool() {
  if (!appEnv.databaseUrl) {
    return null;
  }

  if (!pool) {
    pool = new Pool({
      connectionString: appEnv.databaseUrl,
      ssl: {
        rejectUnauthorized: false,
      },
    });
  }

  return pool;
}

export async function withDb<T>(handler: (db: Pool) => Promise<T>) {
  const db = getPool();

  if (!db) {
    return null;
  }

  return handler(db);
}
