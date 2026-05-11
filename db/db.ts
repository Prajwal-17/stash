import "dotenv/config";
import { drizzle } from "drizzle-orm/libsql";
import { mkdirSync } from "node:fs";
import { dirname, resolve } from "node:path";

const isProd = process.env.NODE_ENV === "production";
const localDbFile = process.env.DB_FILE_NAME || "./db/local.sqlite";
const localDbUrl = localDbFile.startsWith("file:")
  ? localDbFile
  : `file:${localDbFile}`;

if (!isProd) {
  mkdirSync(dirname(resolve(localDbFile)), { recursive: true });
}

export const db = drizzle(
  isProd
    ? {
        connection: {
          url: process.env.TURSO_DATABASE_URL!,
          authToken: process.env.TURSO_AUTH_TOKEN!,
        },
      }
    : {
        connection: {
          url: localDbUrl,
        },
      },
);
