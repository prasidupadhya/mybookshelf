import { createHash } from 'node:crypto';

export const SHELF_IDS = ['currently_reading', 'want_to_read', 'read'];
// Explicit projection: public requests never query account/session tables or expose private metadata.
export const PUBLIC_COLUMNS = 'id, slug, title, title_es, author, shelf, sort_order, page_count, cover_url, cover_texture_url, cover_aspect, back_cover_url, accent_color, spine_color, spine_text_color, back_color, spine_title_override, spine_author_override, goodreads_url, description_en, description_es';
export const EDITABLE_COLUMNS = PUBLIC_COLUMNS.split(', ').filter(key => key !== 'id').concat(['started_at', 'finished_at']);

export function groupBooks(books) {
  return { shelves: Object.fromEntries(SHELF_IDS.map(shelf => [shelf, books.filter(book => book.shelf === shelf)])) };
}

export async function publicBooks(db) {
  const rows = await db.query(`SELECT ${PUBLIC_COLUMNS} FROM books ORDER BY CASE shelf WHEN 'currently_reading' THEN 0 WHEN 'want_to_read' THEN 1 ELSE 2 END, sort_order, created_at, slug`);
  // WebGL requires readable pixels. A bounded, same-origin relay also supports hosts without CORS.
  const texture = (book, face, source) => source ? `/api/books/${book.id}/cover?face=${face}&rev=${createHash('sha256').update(source).digest('hex').slice(0, 16)}` : null;
  return groupBooks(rows.map(book => ({
    ...book,
    cover_texture_url: texture(book, 'front', book.cover_texture_url || book.cover_url),
    back_cover_texture_url: texture(book, 'back', book.back_cover_url)
  })));
}
