import { requireSession, csrf } from '../../../lib/auth.js';
import { api, HttpError, json, method, readJson } from '../../../lib/http.js';
import { UUID } from '../../../lib/validation.js';
import { SHELF_IDS } from '../../../lib/book-records.js';

export default api(async (req, res) => {
  const { db } = await requireSession(req, res);
  method(req, res, ['POST']); csrf(req);
  const { shelf, ids, ...extra } = await readJson(req);
  if (Object.keys(extra).length || !SHELF_IDS.includes(shelf) || !Array.isArray(ids) || ids.length > 1000 || ids.some(id => typeof id !== 'string' || !UUID.test(id)) || new Set(ids).size !== ids.length) throw new HttpError(400, 'Invalid shelf order');
  const books = await db.query('SELECT * FROM reorder_books($1, $2::uuid[])', [shelf, ids]);
  json(res, 200, { books });
}, { admin: true });
