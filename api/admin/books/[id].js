import { requireSession, csrf } from '../../../lib/auth.js';
import { api, HttpError, json, method, readJson } from '../../../lib/http.js';
import { validateBook, UUID } from '../../../lib/validation.js';

export default api(async (req, res) => {
  const { db } = await requireSession(req, res);
  method(req, res, ['PATCH', 'DELETE']); csrf(req);
  const id = req.query?.id;
  if (typeof id !== 'string' || !UUID.test(id)) throw new HttpError(400, 'Invalid book id');
  if (req.method === 'DELETE') {
    const rows = await db.query('DELETE FROM books WHERE id = $1 RETURNING id', [id]);
    if (!rows.length) throw new HttpError(404, 'Book not found');
    return json(res, 200, { ok: true });
  }
  const patch = validateBook(await readJson(req), { partial: true });
  const [current] = await db.query('SELECT * FROM books WHERE id = $1', [id]);
  if (!current) throw new HttpError(404, 'Book not found');
  const moving = patch.shelf && patch.shelf !== current.shelf;
  if (moving && patch.shelf === 'currently_reading' && !current.started_at && patch.started_at === undefined) patch.started_at = new Date().toISOString();
  if (moving && patch.shelf === 'read' && !current.finished_at && patch.finished_at === undefined) patch.finished_at = new Date().toISOString();
  // Changing artwork must not keep using a texture of the previous edition.
  if (patch.cover_url !== undefined && patch.cover_url !== current.cover_url && patch.cover_texture_url === undefined) patch.cover_texture_url = null;
  const merged = { ...current, ...patch };
  if (merged.started_at && merged.finished_at && Date.parse(merged.finished_at) < Date.parse(merged.started_at)) throw new HttpError(400, 'Finished date must be on or after the started date');
  const keys = Object.keys(patch).filter(key => !(moving && key === 'sort_order'));
  const params = keys.map(key => patch[key]); params.push(id);
  const assignments = keys.map((key, i) => `${key} = $${i + 1}`);
  if (moving) {
    params.push(patch.shelf);
    assignments.push(`sort_order = COALESCE((SELECT max(sort_order) + 1 FROM books WHERE shelf = $${params.length}), 0)`);
  }
  const results = await db.transaction([
    db.query('LOCK TABLE books IN SHARE ROW EXCLUSIVE MODE'),
    db.query(`UPDATE books SET ${assignments.join(', ')} WHERE id = $${keys.length + 1} RETURNING *`, params)
  ]);
  if (!results[1].length) throw new HttpError(404, 'Book not found');
  json(res, 200, { book: results[1][0] });
}, { admin: true });
