export class HttpError extends Error {
  constructor(status, message) { super(message); this.status = status; }
}

export function json(res, status, data) {
  res.statusCode = status;
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.end(JSON.stringify(data));
}

export function method(req, res, allowed) {
  if (!allowed.includes(req.method)) {
    res.setHeader('Allow', allowed.join(', '));
    throw new HttpError(405, 'Method not allowed');
  }
}

export async function readJson(req) {
  if (!/^application\/json(?:\s*;|$)/i.test(req.headers['content-type'] || '')) throw new HttpError(415, 'Send application/json');
  if (Number(req.headers['content-length']) > 65536) throw new HttpError(413, 'Request is too large');
  let body = req.body;
  if (body === undefined) {
    const parts = []; let bytes = 0;
    for await (const part of req) {
      bytes += Buffer.byteLength(part);
      if (bytes > 65536) throw new HttpError(413, 'Request is too large');
      parts.push(Buffer.from(part));
    }
    body = Buffer.concat(parts).toString('utf8');
  }
  if (Buffer.isBuffer(body)) body = body.toString('utf8');
  if (typeof body === 'string') {
    if (Buffer.byteLength(body) > 65536) throw new HttpError(413, 'Request is too large');
    try { body = JSON.parse(body); } catch { throw new HttpError(400, 'Invalid JSON'); }
  }
  if (!body || typeof body !== 'object' || Array.isArray(body)) throw new HttpError(400, 'Send a JSON object');
  if (Buffer.byteLength(JSON.stringify(body)) > 65536) throw new HttpError(413, 'Request is too large');
  return body;
}

export function api(handler, { admin = false } = {}) {
  return async (req, res) => {
    res.setHeader('Cache-Control', 'no-store');
    res.setHeader('X-Content-Type-Options', 'nosniff');
    if (admin) res.setHeader('X-Robots-Tag', 'noindex, nofollow');
    try { await handler(req, res); }
    catch (error) {
      if (res.writableEnded) return;
      if (error instanceof HttpError) return json(res, error.status, { error: error.message });
      if (error.code === '23505') return json(res, 409, { error: 'That book slug already exists' });
      if (error.code === '23514') return json(res, 409, { error: 'The shelf changed or the record is invalid. Refresh and try again.' });
      // Never log SQL, request bodies, stack traces or connection strings.
      console.error('Bookshelf request failed', { code: /^[0-9A-Z]{5}$/.test(error.code || '') ? error.code : 'unavailable' });
      json(res, 503, { error: 'Service temporarily unavailable. Please try again.' });
    }
  };
}
