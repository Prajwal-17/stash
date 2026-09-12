import "dotenv/config";
import { createClient, type Client } from "@libsql/client";
import { drizzle } from "drizzle-orm/libsql";
import { mkdirSync } from "node:fs";
import { dirname, resolve } from "node:path";
import * as schema from "./schema";

let client: Client | undefined;

function getClient(): Client {
  if (client) return client;

  if (process.env.NODE_ENV === "production") {
    const url = process.env.TURSO_DATABASE_URL?.trim();
    if (!url) {
      throw new Error(
        "TURSO_DATABASE_URL is required to access the production database. " +
          "Configure TURSO_DATABASE_URL and TURSO_AUTH_TOKEN in your deployment environment."
      );
    }

    client = createClient({ url, authToken: process.env.TURSO_AUTH_TOKEN });
  } else {
    const localDbFile = process.env.DB_FILE_NAME || "./.data/stash.sqlite";
    const localDbUrl = localDbFile.startsWith("file:") ? localDbFile : `file:${localDbFile}`;
    mkdirSync(dirname(resolve(localDbFile)), { recursive: true });
    client = createClient({ url: localDbUrl });
  }

  return client;
}

// Next.js imports routes during builds. Defer client creation until a database
// operation so route collection does not require production credentials.
const lazyClient = new Proxy({} as Client, {
  get(_target, property) {
    const activeClient = getClient();
    const value = Reflect.get(activeClient, property, activeClient);
    return typeof value === "function" ? value.bind(activeClient) : value;
  }
});

export const db = drizzle({ client: lazyClient, schema });
