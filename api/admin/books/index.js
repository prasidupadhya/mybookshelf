import { requireSession, csrf } from '../../../lib/auth.js';
import { api, json, method, readJson } from '../../../lib/http.js';
import { validateBook } from '../../../lib/validation.js';

export default api(async (req, res) => {
  const { db } = await requireSession(req, res);
  method(req, res, ['GET', 'POST']);
  if (req.method === 'GET') return json(res, 200, { books: await db.query('SELECT * FROM books ORDER BY shelf, sort_order, created_at, slug') });
  csrf(req);
  const book = validateBook(await readJson(req));
  const columns = Object.keys(book).filter(key => key !== 'sort_order');
  const values = columns.map(key => book[key]);
  const shelfIndex = columns.indexOf('shelf') + 1;
  const results = await db.transaction([
    db.query('LOCK TABLE books IN SHARE ROW EXCLUSIVE MODE'),
    db.query(`INSERT INTO books (${columns.join(', ')}, sort_order) VALUES (${columns.map((_, i) => `$${i + 1}`).join(', ')}, COALESCE((SELECT max(sort_order) + 1 FROM books WHERE shelf = $${shelfIndex}), 0)) RETURNING *`, values)
  ]);
  json(res, 201, { book: results[1][0] });
}, { admin: true });
