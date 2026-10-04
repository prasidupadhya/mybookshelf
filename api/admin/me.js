import { requireSession } from '../../lib/auth.js';
import { api, json, method } from '../../lib/http.js';

export default api(async (req, res) => {
  const { session } = await requireSession(req, res);
  method(req, res, ['GET']);
  json(res, 200, { user: { username: session.username } });
}, { admin: true });
