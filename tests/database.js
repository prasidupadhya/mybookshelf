import { PGlite } from '@electric-sql/pglite';
import { readFile } from 'node:fs/promises';
import { EDITABLE_COLUMNS } from '../lib/book-records.js';

export const fixtureBooks = () => Array.from({ length: 5 }, (_, index) => ({
  slug: `fixture-book-${index + 1}`, title: `Test edition ${index + 1}`, title_es: `Edición de prueba ${index + 1}`,
  author: 'Test author', shelf: index === 0 ? 'currently_reading' : index === 1 ? 'want_to_read' : 'read',
  sort_order: index < 2 ? 0 : index - 2, page_count: 100 + index * 50,
  cover_url: 'https://example.com/cover.jpg', cover_aspect: .625,
  accent_color: '#456754', spine_color: '#456754', back_color: '#456754', spine_text_color: '#fff8e8',
  description_en: 'An English test description.', description_es: 'Una descripción de prueba.'
}));

export async function testDatabase({ books = fixtureBooks() } = {}) {
  const pg = new PGlite();
  const source = await readFile(new URL('../db/schema.sql', import.meta.url), 'utf8');
  await pg.exec(source); await pg.exec(source);
  const query = (text, values = []) => ({ text, values, then: (yes, no) => pg.query(text, values).then(result => result.rows).then(yes, no) });
  const db = { query, transaction: queries => pg.transaction(async tx => {
    const results = [];
    for (const { text, values } of queries) results.push((await tx.query(text, values)).rows);
    return results;
  }) };
  for (const book of books) await query(`INSERT INTO books (${EDITABLE_COLUMNS.join(', ')}) VALUES (${EDITABLE_COLUMNS.map((_, i) => `$${i + 1}`).join(', ')})`, EDITABLE_COLUMNS.map(key => book[key] ?? null));
  return { db, pg, books };
}

export async function request(handler, { method = 'GET', body, cookie, id, csrf = true } = {}) {
  const headers = { host: 'localhost:3000', 'content-type': 'application/json', ...(csrf ? { origin: 'http://localhost:3000', 'x-requested-with': 'fetch' } : {}), ...(cookie ? { cookie } : {}) };
  const output = { status: 200, headers: {}, body: null };
  const res = {
    setHeader: (key, value) => { output.headers[key.toLowerCase()] = value; },
    set statusCode(value) { output.status = value; },
    end: value => { output.body = Buffer.isBuffer(value) ? value : JSON.parse(value); res.writableEnded = true; }
  };
  await handler({ method, body, headers, query: { id }, socket: { remoteAddress: '127.0.0.1' } }, res);
  return output;
}
