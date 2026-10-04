import { PGlite } from '@electric-sql/pglite';
import { readFile } from 'node:fs/promises';
import { EDITABLE_COLUMNS } from '../lib/book-records.js';

export async function testDatabase() {
  const pg = new PGlite();
  const source = await readFile(new URL('../db/schema.sql', import.meta.url), 'utf8');
  await pg.exec(source); await pg.exec(source);
  const query = (text, values = []) => ({ text, values, then: (yes, no) => pg.query(text, values).then(result => result.rows).then(yes, no) });
  const db = { query, transaction: queries => pg.transaction(async tx => {
    const results = [];
    for (const { text, values } of queries) results.push((await tx.query(text, values)).rows);
    return results;
  }) };
  const books = JSON.parse(await readFile(new URL('../db/seed-books.json', import.meta.url), 'utf8'));
  for (const book of books) await query(`INSERT INTO books (${EDITABLE_COLUMNS.join(', ')}) VALUES (${EDITABLE_COLUMNS.map((_, i) => `$${i + 1}`).join(', ')})`, EDITABLE_COLUMNS.map(key => book[key] ?? null));
  return { db, pg, books };
}

export async function request(handler, { method = 'GET', body, cookie, id, csrf = true } = {}) {
  const headers = { host: 'localhost:3000', 'content-type': 'application/json', ...(csrf ? { origin: 'http://localhost:3000', 'x-requested-with': 'fetch' } : {}), ...(cookie ? { cookie } : {}) };
  const output = { status: 200, headers: {}, body: null };
  const res = {
    setHeader: (key, value) => { output.headers[key.toLowerCase()] = value; },
    set statusCode(value) { output.status = value; },
    end: value => { output.body = JSON.parse(value); res.writableEnded = true; }
  };
  await handler({ method, body, headers, query: { id }, socket: { remoteAddress: '127.0.0.1' } }, res);
  return output;
}
