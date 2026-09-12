import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { existsSync, mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { test } from "node:test";

function runDatabaseScript(script: string, environment: Partial<NodeJS.ProcessEnv> = {}) {
  const result = spawnSync(process.execPath, ["--import", "tsx", "--eval", script], {
    cwd: process.cwd(),
    env: {
      ...process.env,
      NODE_ENV: "production",
      TURSO_DATABASE_URL: "",
      TURSO_AUTH_TOKEN: "",
      ...environment
    },
    encoding: "utf8"
  });
  assert.equal(result.status, 0, result.stderr || result.stdout);
}

test("database and auth modules can be imported without production database credentials", () => {
  runDatabaseScript(`
    require('./db/db.ts');
    require('./lib/auth.ts');
  `);
});

test("production database access reports missing configuration without a local fallback", () => {
  runDatabaseScript(`
    const assert = require('node:assert/strict');
    const { db } = require('./db/db.ts');
    assert.throws(() => db.$client.execute('select 1'), /TURSO_DATABASE_URL is required/);
  `);
});

test("configured production client supports queries, transactions, and client properties", () => {
  const directory = mkdtempSync(join(tmpdir(), "stash-production-db-test-"));
  try {
    runDatabaseScript(
      `
      const assert = require('node:assert/strict');
      const { sql } = require('drizzle-orm');
      const { db } = require('./db/db.ts');
      (async () => {
        await db.run(sql\`create table probe (value text)\`);
        await db.run(sql\`insert into probe values ('saved')\`);
        await assert.rejects(db.transaction(async (tx) => {
          await tx.run(sql\`insert into probe values ('rolled back')\`);
          throw new Error('rollback test');
        }), /rollback test/);
        assert.deepEqual(await db.all(sql\`select value from probe\`), [{ value: 'saved' }]);
        assert.equal(db.$client.closed, false);
        db.$client.close();
        assert.equal(db.$client.closed, true);
      })().catch((error) => { console.error(error); process.exitCode = 1; });
    `,
      { TURSO_DATABASE_URL: `file:${join(directory, "stash.sqlite")}` }
    );
  } finally {
    rmSync(directory, { recursive: true, force: true });
  }
});

test("development still creates and uses the configured local SQLite file", () => {
  const directory = mkdtempSync(join(tmpdir(), "stash-db-test-"));
  const databaseFile = join(directory, "nested", "stash.sqlite");
  try {
    runDatabaseScript(
      `
        const { db } = require('./db/db.ts');
        (async () => {
          await db.$client.execute('create table probe (value text)');
          db.$client.close();
        })().catch((error) => { console.error(error); process.exitCode = 1; });
      `,
      { NODE_ENV: "development", DB_FILE_NAME: databaseFile }
    );
    assert.ok(existsSync(databaseFile));
  } finally {
    rmSync(directory, { recursive: true, force: true });
  }
});
