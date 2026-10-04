import { getDb } from '../lib/db.js';
import { publicBooks } from '../lib/book-records.js';
import { api, json, method } from '../lib/http.js';

export default api(async (req, res) => {
  method(req, res, ['GET']);
  const data = await publicBooks(getDb());
  res.setHeader('Cache-Control', 'public, max-age=0, s-maxage=60, stale-while-revalidate=300');
  json(res, 200, data);
});
