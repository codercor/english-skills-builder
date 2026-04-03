import postgres from "postgres";
import { drizzle } from "drizzle-orm/postgres-js";
import * as schema from "@/lib/db/schema";

const databaseUrl = process.env.DATABASE_URL;
const client = databaseUrl
  ? postgres(databaseUrl, {
      // Runtime uses pooled connections in production, so prepared statements stay off
      // to avoid pgbouncer incompatibilities across serverless invocations.
      prepare: false,
      max: 1,
    })
  : null;

export const db = client ? drizzle(client, { schema }) : null;
