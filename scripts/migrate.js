import { readFile } from 'node:fs/promises';
import { getDb } from '../lib/db.js';
import { loadLocalEnv } from '../lib/env.js';

loadLocalEnv();
try {
  const source = await readFile(new URL('../db/schema.sql', import.meta.url), 'utf8');
  // No user input is interpolated into this checked-in migration.
  const db = getDb();
  const statements = source.split(/^-- statement\s*$/m).slice(1).map(sql => db.query(sql.trim()));
  await db.transaction(statements);
  console.log('Schema migrated successfully (safe to run again).');
} catch {
  console.error('Migration failed. Check DATABASE_URL and database access; no connection details were logged.');
  process.exitCode = 1;
}
