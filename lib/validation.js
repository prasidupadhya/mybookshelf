import { HttpError } from './http.js';
import { EDITABLE_COLUMNS, SHELF_IDS } from './book-records.js';

export const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const HEX = /^#[0-9a-f]{6}$/i;
const TEXT_LIMITS = { slug: 100, title: 300, title_es: 300, author: 300, spine_title_override: 160, spine_author_override: 160, description_en: 10000, description_es: 10000 };
const REQUIRED = ['slug', 'title', 'author', 'shelf'];

export function username(value) {
  if (typeof value !== 'string') throw new HttpError(400, 'Username is required');
  const result = value.trim().toLowerCase();
  if (!/^[a-z0-9][a-z0-9._-]{2,63}$/.test(result)) throw new HttpError(400, 'Use 3–64 letters, numbers, dots, underscores or hyphens for the username');
  return result;
}

function url(value, key) {
  if (value === null || value === '') return null;
  if (typeof value !== 'string' || value.length > 2048) throw new HttpError(400, `${key} must be a valid URL`);
  // Only the texture field may reference already-deployed, same-origin artwork.
  if (key === 'cover_texture_url' && /^\/assets\/images\/covers\/[a-zA-Z0-9._-]+\.(jpg|jpeg|png|webp)$/.test(value)) return value;
  let parsed;
  try { parsed = new URL(value); } catch { throw new HttpError(400, `${key} must be an http(s) URL`); }
  if (!['https:', 'http:'].includes(parsed.protocol) || parsed.username || parsed.password) throw new HttpError(400, `${key} must be an http(s) URL without credentials`);
  return parsed.href;
}

export function validateBook(body, { partial = false } = {}) {
  const out = {};
  for (const [key, value] of Object.entries(body)) {
    if (!EDITABLE_COLUMNS.includes(key)) throw new HttpError(400, `Unknown field: ${key}`);
    if (key in TEXT_LIMITS) {
      if (value === null && !REQUIRED.includes(key)) { out[key] = key.startsWith('description_') ? '' : null; continue; }
      if (typeof value !== 'string' || value.length > TEXT_LIMITS[key] || /[\u0000-\u0008\u000b\u000c\u000e-\u001f]/.test(value)) throw new HttpError(400, `${key} is invalid or too long`);
      out[key] = value.trim();
      if (REQUIRED.includes(key) && !out[key]) throw new HttpError(400, `${key} is required`);
    } else if (key.endsWith('_url')) {
      out[key] = url(value, key);
    } else if (key.endsWith('_color')) {
      if (key === 'spine_text_color' && (value === null || value === '')) { out[key] = null; continue; }
      if (typeof value !== 'string' || !HEX.test(value)) throw new HttpError(400, `${key} must be a six-digit hex color`);
      out[key] = value.toLowerCase();
    } else if (key === 'shelf') {
      if (!SHELF_IDS.includes(value)) throw new HttpError(400, 'Invalid shelf');
      out[key] = value;
    } else if (key === 'page_count' || key === 'sort_order') {
      if (key === 'page_count' && (value === null || value === '')) { out[key] = null; continue; }
      if (!Number.isInteger(value) || value < (key === 'page_count' ? 1 : 0) || value > (key === 'page_count' ? 20000 : 1000000)) throw new HttpError(400, `${key} must be a valid whole number`);
      out[key] = value;
    } else if (key === 'cover_aspect') {
      if (typeof value !== 'number' || !Number.isFinite(value) || value < .2 || value > 2) throw new HttpError(400, 'Cover aspect must be between 0.2 and 2');
      out[key] = value;
    } else if (key.endsWith('_at')) {
      if (value === null || value === '') { out[key] = null; continue; }
      if (typeof value !== 'string' || value.length > 35 || !/^\d{4}-\d{2}-\d{2}T/.test(value) || !Number.isFinite(Date.parse(value))) throw new HttpError(400, `${key} must be a valid ISO date`);
      out[key] = new Date(value).toISOString();
    }
  }
  if (out.slug !== undefined && !/^[a-z0-9]+(-[a-z0-9]+)*$/.test(out.slug)) throw new HttpError(400, 'Slug must use lowercase words separated by hyphens');
  if (!partial) {
    for (const key of REQUIRED) if (!out[key]) throw new HttpError(400, `${key} is required`);
    out.spine_color ??= '#b99a5b'; out.back_color ??= out.spine_color;
    out.accent_color ??= out.spine_color;
    out.description_en ??= ''; out.description_es ??= '';
    out.cover_aspect ??= .625;
  }
  if (!Object.keys(out).length) throw new HttpError(400, 'No book fields supplied');
  return out;
}
