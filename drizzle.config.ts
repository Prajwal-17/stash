import "dotenv/config";
import { defineConfig } from "drizzle-kit";
import { mkdirSync } from "node:fs";
import { dirname, resolve } from "node:path";

const isProd = process.env.NODE_ENV === "production";
const localDbFile = process.env.DB_FILE_NAME || "./.dist/stash.sqlite";
const localDbUrl = localDbFile.startsWith("file:") ? localDbFile : `file:${localDbFile}`;

if (!isProd) {
  mkdirSync(dirname(resolve(localDbFile)), { recursive: true });
}

export default defineConfig({
  out: "./drizzle",
  schema: "./db/schema.ts",
  dialect: "turso",
  dbCredentials: isProd
    ? {
        url: process.env.TURSO_DATABASE_URL!,
        authToken: process.env.TURSO_AUTH_TOKEN!
      }
    : {
        url: localDbUrl
      }
});
