import { requireSession, csrf } from '../../lib/auth.js';
import { api, HttpError, method, readJson } from '../../lib/http.js';
import { fetchCoverImage } from '../../lib/cover-image.js';

export default api(async (req, res) => {
  await requireSession(req, res); method(req, res, ['GET', 'POST']);
  if (req.method === 'POST') csrf(req);
  const { url, ...extra } = req.method === 'POST' ? await readJson(req) : req.query || {};
  if (Object.keys(extra).length || typeof url !== 'string' || url.length > 2048) throw new HttpError(400, 'Use a valid cover URL');
  let image;
  try { image = await fetchCoverImage(url); }
  catch (error) { if (error instanceof HttpError) throw error; throw new HttpError(400, 'The cover could not be downloaded. Check its URL or choose colors manually.'); }
  res.setHeader('Content-Type', image.type); res.statusCode = 200; res.end(image.bytes);
}, { admin: true });
