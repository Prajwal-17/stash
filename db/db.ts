import "dotenv/config";
import { createClient } from "@libsql/client";
import { drizzle } from "drizzle-orm/libsql";
import { mkdirSync } from "node:fs";
import { dirname, resolve } from "node:path";
import * as schema from "./schema";

const isProduction = process.env.NODE_ENV === "production";
const localDbFile = process.env.DB_FILE_NAME || "./.data/stash.sqlite";
const localDbUrl = localDbFile.startsWith("file:") ? localDbFile : `file:${localDbFile}`;

if (!isProduction) {
  mkdirSync(dirname(resolve(localDbFile)), { recursive: true });
}

const client = createClient(
  isProduction
    ? {
        url: process.env.TURSO_DATABASE_URL!,
        authToken: process.env.TURSO_AUTH_TOKEN!
      }
    : {
        url: localDbUrl
      }
);

export const db = drizzle({ client, schema });
