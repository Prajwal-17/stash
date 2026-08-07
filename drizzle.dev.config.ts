import "dotenv/config";
import { defineConfig } from "drizzle-kit";
import { mkdirSync } from "node:fs";
import { dirname, resolve } from "node:path";

const localDbFile = process.env.DB_FILE_NAME || "./.data/stash.sqlite";
const localDbUrl = localDbFile.startsWith("file:") ? localDbFile : `file:${localDbFile}`;

mkdirSync(dirname(resolve(localDbFile)), { recursive: true });

export default defineConfig({
  out: "./drizzle",
  schema: "./db/schema.ts",
  dialect: "turso",
  dbCredentials: {
    url: localDbUrl
  }
});
