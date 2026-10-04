const SHELVES = { currently_reading: 'current', want_to_read: 'want', read: 'read' };
const COLOR = /^#[0-9a-f]{6}$/i;

function safeUrl(value, localTexture = false) {
  if (!value) return null;
  if (typeof value !== 'string') throw new Error('Invalid image URL');
  if (localTexture && /^\/api\/books\/[0-9a-f-]{36}\/cover\?face=(front|back)&rev=[0-9a-f]{16}$/.test(value)) return value;
  const url = new URL(value);
  if (!['http:', 'https:'].includes(url.protocol) || url.username || url.password) throw new Error('Invalid URL');
  return url.href;
}

export function normalizeBooks(payload) {
  if (!payload?.shelves || Object.keys(SHELVES).some(shelf => !Array.isArray(payload.shelves[shelf]))) throw new Error('Invalid book collection');
  const records = Object.keys(SHELVES).flatMap(shelf => payload.shelves[shelf].map(record => {
    if (record.shelf !== shelf || typeof record.slug !== 'string' || !/^[a-z0-9]+(-[a-z0-9]+)*$/.test(record.slug) || typeof record.title !== 'string' || typeof record.author !== 'string') throw new Error('Invalid book record');
    const spine = COLOR.test(record.spine_color) ? record.spine_color : '#b99a5b';
    return {
      id: record.slug, dbId: record.id,
      title: { en: record.title, es: record.title_es || record.title }, author: record.author,
      shelf: SHELVES[shelf], shelfOrder: Object.keys(SHELVES).indexOf(shelf) + 1,
      sortOrder: record.sort_order,
      pageCount: Number.isInteger(record.page_count) && record.page_count > 0 ? record.page_count : null,
      coverAspect: typeof record.cover_aspect === 'number' && record.cover_aspect >= .2 && record.cover_aspect <= 2 ? record.cover_aspect : .625,
      accentColor: COLOR.test(record.accent_color) ? record.accent_color : spine,
      spineColor: spine, spineTextColor: COLOR.test(record.spine_text_color) ? record.spine_text_color : null,
      backColor: COLOR.test(record.back_color) ? record.back_color : spine,
      spineTitle: record.spine_title_override, spineAuthor: record.spine_author_override ?? undefined,
      coverUrl: safeUrl(record.cover_url), coverTextureUrl: safeUrl(record.cover_texture_url, true),
      backCoverUrl: safeUrl(record.back_cover_url), backCoverTextureUrl: safeUrl(record.back_cover_texture_url, true), url: safeUrl(record.goodreads_url),
      description: { en: String(record.description_en || ''), es: String(record.description_es || '') }
    };
  }));
  if (new Set(records.map(record => record.id)).size !== records.length) throw new Error('Duplicate book slugs');
  return records;
}

async function fetchBooks(url, timeout) {
  const response = await fetch(url, { signal: AbortSignal.timeout(timeout), credentials: 'same-origin' });
  if (!response.ok) throw new Error('Books unavailable');
  return normalizeBooks(await response.json());
}

// Vercel includes query strings in the cache key. Each minute starts with fresh database results.
export const loadPublicBooks = () => fetchBooks(`/api/books?minute=${Math.floor(Date.now() / 60000)}`, 8000);
