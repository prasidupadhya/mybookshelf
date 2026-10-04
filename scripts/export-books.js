import { writeFile } from 'node:fs/promises';
import { pathToFileURL } from 'node:url';
import { getDb } from '../lib/db.js';
import { loadLocalEnv } from '../lib/env.js';
import { publicBooks } from '../lib/book-records.js';

export async function exportBooks(db = getDb()) {
  const snapshot = await publicBooks(db);
  await writeFile(new URL('../public/assets/data/books.snapshot.json', import.meta.url), JSON.stringify(snapshot, null, 2) + '\n');
  console.log(`Exported ${Object.values(snapshot.shelves).flat().length} public books to the fallback snapshot.`);
}

if (import.meta.url === pathToFileURL(process.argv[1]).href) {
  loadLocalEnv();
  try { await exportBooks(); }
  catch { console.error('Export failed. Check DATABASE_URL; the existing snapshot was preserved.'); process.exitCode = 1; }
}
