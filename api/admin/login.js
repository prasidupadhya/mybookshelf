import { getDb } from '../../lib/db.js';
import { csrf, ipHash, createSession } from '../../lib/auth.js';
import { verifyPassword, DUMMY_HASH } from '../../lib/passwords.js';
import { username } from '../../lib/validation.js';
import { api, HttpError, json, method, readJson } from '../../lib/http.js';

const INVALID = 'Invalid username or password';
export default api(async (req, res) => {
  method(req, res, ['POST']); csrf(req);
  const body = await readJson(req);
  let name;
  try { name = username(body.username); } catch { throw new HttpError(401, INVALID); }
  if (typeof body.password !== 'string' || !body.password.length || body.password.length > 128) throw new HttpError(401, INVALID);
  const db = getDb();
  await db.query("DELETE FROM login_attempts WHERE attempted_at < now() - interval '1 day'");
  const [{ attempt_id: attempt }] = await db.query('SELECT reserve_login_attempt($1, $2) AS attempt_id', [name, ipHash(req)]);
  if (!attempt) { res.setHeader('Retry-After', '900'); throw new HttpError(429, INVALID); }
  const [user] = await db.query('SELECT id, username, password_hash FROM admin_users WHERE username = $1', [name]);
  const matches = await verifyPassword(body.password, user?.password_hash || DUMMY_HASH);
  if (!user || !matches) throw new HttpError(401, INVALID);
  await db.query('UPDATE login_attempts SET success = true WHERE id = $1', [attempt]);
  await createSession(db, user, req, res);
  json(res, 200, { user: { username: user.username } });
}, { admin: true });
