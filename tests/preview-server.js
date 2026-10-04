// Isolated, disposable browser QA database. Never imported by any deployed function.
import { mock } from 'node:test';
import { testDatabase } from './database.js';
import { hashPassword } from '../lib/passwords.js';
import { randomBytes } from 'node:crypto';
import { readFile } from 'node:fs/promises';

const books = process.env.TEST_PRIVATE_BOOKS ? JSON.parse(await readFile(new URL('../.local-data/books-import.json', import.meta.url), 'utf8')) : undefined;
if (books) for (const book of books) if (book.cover_texture_url?.startsWith('/assets/')) book.cover_texture_url = book.cover_url;
const { db } = await testDatabase({ books });
mock.module('../lib/db.js', { namedExports: { getDb: () => db } });
process.env.SESSION_SECRET = randomBytes(32).toString('hex');
process.env.PORT ||= '3034';
await db.query('INSERT INTO admin_users (username, password_hash) VALUES ($1, $2)', ['ui-test', await hashPassword('Temporary UI test password!')]);
await import('../scripts/dev.js');
