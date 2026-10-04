import { writeFile, mkdir, chmod } from 'node:fs/promises';
import { pathToFileURL } from 'node:url';
import { getDb } from '../lib/db.js';
import { loadLocalEnv } from '../lib/env.js';

export async function exportBooks(db = getDb()) {
  const books = await db.query('SELECT * FROM books ORDER BY shelf, sort_order, created_at, slug');
  const directory = new URL('../.local-data/', import.meta.url);
  await mkdir(directory, { recursive: true, mode: 0o700 });
  const path = new URL('books-backup.json', directory);
  await writeFile(path, JSON.stringify(books, null, 2) + '\n', { mode: 0o600 });
  await chmod(path, 0o600);
  console.log(`Exported ${books.length} books to ignored .local-data/books-backup.json. No public snapshot is generated.`);
}

if (import.meta.url === pathToFileURL(process.argv[1]).href) {
  loadLocalEnv();
  try { await exportBooks(); }
  catch { console.error('Export failed. Check DATABASE_URL; no connection details were logged.'); process.exitCode = 1; }
}
