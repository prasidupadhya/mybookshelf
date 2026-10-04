import { readFile } from 'node:fs/promises';
import { getDb } from '../lib/db.js';
import { loadLocalEnv } from '../lib/env.js';
import { EDITABLE_COLUMNS } from '../lib/book-records.js';
import { validateBook } from '../lib/validation.js';
import { exportBooks } from './export-books.js';

loadLocalEnv();
try {
  // Original editions live in Neon. Imports are private files, never deployed frontend assets.
  const source = JSON.parse(await readFile(new URL('../.local-data/books-import.json', import.meta.url), 'utf8'));
  if (!Array.isArray(source) || !source.length) throw new Error('No private import source');
  const books = source.map(record => {
    const fields = Object.fromEntries(EDITABLE_COLUMNS.filter(key => key in record).map(key => [key, record[key]]));
    // Old local textures are now downloaded from the stored cover URL through the public relay.
    if (fields.cover_texture_url?.startsWith('/assets/')) fields.cover_texture_url = fields.cover_url;
    return validateBook(fields);
  });
  const db = getDb();
  const before = await db.query('SELECT * FROM books WHERE slug = ANY($1::text[])', [books.map(book => book.slug)]);
  const columns = EDITABLE_COLUMNS;
  const statements = books.map(book => db.query(
    `INSERT INTO books (${columns.join(', ')}) VALUES (${columns.map((_, i) => `$${i + 1}`).join(', ')})
     ON CONFLICT (slug) DO UPDATE SET ${columns.filter(key => key !== 'slug').map(key => `${key} = EXCLUDED.${key}`).join(', ')} RETURNING *`,
    columns.map(key => book[key] ?? null)
  ));
  const results = await db.transaction(statements);
  for (let i = 0; i < books.length; i++) {
    const previous = before.find(book => book.slug === books[i].slug);
    const after = results[i][0];
    const changes = Object.fromEntries(columns.filter(key => JSON.stringify(previous?.[key] ?? null) !== JSON.stringify(after[key] ?? null)).map(key => [key, { before: previous?.[key] ?? null, after: after[key] }]));
    console.log(JSON.stringify({ slug: after.slug, action: previous ? 'upsert' : 'insert', changes }, null, 2));
  }
  await exportBooks(db);
} catch {
  console.error('Import failed. Check .local-data/books-import.json, DATABASE_URL and the migration. No credentials were logged.');
  process.exitCode = 1;
}
