import { readFile } from 'node:fs/promises';
import { getDb } from '../lib/db.js';
import { loadLocalEnv } from '../lib/env.js';
import { EDITABLE_COLUMNS } from '../lib/book-records.js';
import { exportBooks } from './export-books.js';

loadLocalEnv();
try {
  // This immutable migration source captures every original data.js book, including EN/ES artwork metadata.
  const books = JSON.parse(await readFile(new URL('../db/seed-books.json', import.meta.url), 'utf8'));
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
  console.error('Seed failed. Check DATABASE_URL and run the migration first. No credentials were logged.');
  process.exitCode = 1;
}
