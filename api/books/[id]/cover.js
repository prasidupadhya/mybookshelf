import { getDb } from '../../../lib/db.js';
import { api, HttpError, method } from '../../../lib/http.js';
import { UUID } from '../../../lib/validation.js';
import { fetchCoverImage } from '../../../lib/cover-image.js';
import { coverRevision } from '../../../lib/book-records.js';

// Public relay accepts only a database book ID, never an arbitrary image URL.
export default api(async (req, res) => {
  method(req, res, ['GET']);
  const { id, face = 'front', rev } = req.query || {};
  if (!UUID.test(id || '') || !['front', 'back'].includes(face)) throw new HttpError(400, 'Invalid book cover');
  const [book] = await getDb().query('SELECT cover_url, cover_texture_url, back_cover_url FROM books WHERE id = $1', [id]);
  const source = face === 'back' ? book?.back_cover_url : book?.cover_texture_url || book?.cover_url;
  if (!source) throw new HttpError(404, 'Cover unavailable');
  let image;
  try { image = await fetchCoverImage(source); }
  catch { throw new HttpError(502, 'Cover temporarily unavailable'); }
  // The public collection links each cover with its source revision. A matching revision is immutable;
  // a stale or missing one keeps the short cache so a replaced cover appears within a minute.
  res.setHeader('Cache-Control', rev === coverRevision(source)
    ? 'public, max-age=31536000, s-maxage=31536000, immutable'
    : 'public, max-age=60, s-maxage=60, stale-while-revalidate=300');
  res.setHeader('Content-Type', image.type);
  res.statusCode = 200; res.end(image.bytes);
});
