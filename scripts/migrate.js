import { readFile } from 'node:fs/promises';
import { getDb } from '../lib/db.js';
import { loadLocalEnv } from '../lib/env.js';

loadLocalEnv();
try {
  const source = await readFile(new URL('../db/schema.sql', import.meta.url), 'utf8');
  // No user input is interpolated into this checked-in migration.
  await getDb().query(source);
  console.log('Schema migrated successfully (safe to run again).');
} catch {
  console.error('Migration failed. Check DATABASE_URL and database access; no connection details were logged.');
  process.exitCode = 1;
}
