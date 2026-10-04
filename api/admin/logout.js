import { requireSession, csrf, clearSessionCookie } from '../../lib/auth.js';
import { api, json, method } from '../../lib/http.js';

export default api(async (req, res) => {
  const { db, session } = await requireSession(req, res);
  method(req, res, ['POST']); csrf(req);
  await db.query('DELETE FROM sessions WHERE id = $1', [session.id]);
  clearSessionCookie(res); json(res, 200, { ok: true });
}, { admin: true });
