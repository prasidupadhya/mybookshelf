import { createHash, createHmac, randomBytes, timingSafeEqual } from 'node:crypto';
import { getDb } from './db.js';
import { requiredEnv } from './env.js';
import { HttpError } from './http.js';

const COOKIE = '__Host-bookshelf';
const AGE = 7 * 24 * 60 * 60;
const sha256 = value => createHash('sha256').update(value).digest('hex');

function sign(value) {
  const secret = requiredEnv('SESSION_SECRET');
  if (Buffer.byteLength(secret) < 32) throw new Error('SESSION_SECRET is too short');
  return createHmac('sha256', secret).update(value).digest('base64url');
}

export function ipHash(req) {
  // Only trust the forwarded address when running behind Vercel's proxy.
  const forwarded = process.env.VERCEL ? req.headers['x-vercel-forwarded-for'] || req.headers['x-forwarded-for'] : null;
  const ip = typeof forwarded === 'string' ? forwarded.split(',')[0].trim() : req.socket?.remoteAddress || 'unknown';
  return sign(`ip:${ip}`);
}

export function csrf(req) {
  if (req.headers['x-requested-with'] !== 'fetch') throw new HttpError(403, 'Request origin could not be verified');
  const host = req.headers.host;
  let origin;
  try { origin = new URL(req.headers.origin); } catch { throw new HttpError(403, 'Request origin could not be verified'); }
  const protocol = process.env.VERCEL || req.socket?.encrypted ? 'https:' : 'http:';
  if (!host || origin.host !== host || origin.protocol !== protocol || origin.origin !== req.headers.origin) throw new HttpError(403, 'Request origin could not be verified');
}

export function clearSessionCookie(res) {
  res.setHeader('Set-Cookie', `${COOKIE}=; HttpOnly; Secure; SameSite=Strict; Path=/; Max-Age=0`);
}

export async function requireSession(req, res) {
  const raw = String(req.headers.cookie || '').split(';').map(part => part.trim()).find(part => part.startsWith(`${COOKIE}=`))?.slice(COOKIE.length + 1);
  if (!raw || !/^[A-Za-z0-9_-]{43}\.[A-Za-z0-9_-]{43}$/.test(raw)) throw new HttpError(401, 'Please sign in');
  const [token, signature] = raw.split('.');
  const expected = sign(`session:${token}`);
  if (!timingSafeEqual(Buffer.from(signature), Buffer.from(expected))) { clearSessionCookie(res); throw new HttpError(401, 'Please sign in'); }
  const db = getDb();
  const [session] = await db.query(
    'SELECT s.id, s.user_id, u.username FROM sessions s JOIN admin_users u ON u.id = s.user_id WHERE s.token_hash = $1 AND s.expires_at > now()', [sha256(token)]
  );
  if (!session) { clearSessionCookie(res); throw new HttpError(401, 'Please sign in'); }
  return { db, session };
}

export async function createSession(db, user, req, res) {
  const token = randomBytes(32).toString('base64url');
  const signature = sign(`session:${token}`);
  await db.transaction([
    db.query('DELETE FROM sessions WHERE expires_at < now()'),
    db.query("INSERT INTO sessions (user_id, token_hash, expires_at, user_agent, ip_hash) VALUES ($1, $2, now() + interval '7 days', $3, $4)", [user.id, sha256(token), String(req.headers['user-agent'] || '').slice(0, 512), ipHash(req)]),
    db.query('UPDATE admin_users SET last_login_at = now() WHERE id = $1', [user.id])
  ]);
  res.setHeader('Set-Cookie', `${COOKIE}=${token}.${signature}; HttpOnly; Secure; SameSite=Strict; Path=/; Max-Age=${AGE}`);
}
