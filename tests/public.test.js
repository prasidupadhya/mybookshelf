import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { normalizeBooks } from '../public/assets/js/books-api.js';
import { getBookThickness, getReadableInk } from '../public/assets/js/book-appearance.js';

test('Snapshot preserves all original edition metadata and appearance', async () => {
  const snapshot = JSON.parse(await readFile(new URL('../public/assets/data/books.snapshot.json', import.meta.url), 'utf8'));
  const books = normalizeBooks(snapshot);
  assert.deepEqual(books.map(book => book.id), ['the-metamorphosis', 'the-bhagavad-gita', 'siddhartha', 'the-stranger', 'white-nights']);
  assert.deepEqual(books.map(book => getBookThickness(book.pageCount)), [22, 29, 25, 22, 21]);
  assert.deepEqual(books.map(book => book.spineTextColor || getReadableInk(book.spineColor)), ['#17110f', '#fff8e8', '#17110f', '#fff8e8', '#17110f']);
  assert.equal(books[3].title.es, 'El Extranjero');
  assert.equal(books[1].spineAuthor, '');
  assert.equal(books[4].coverTextureUrl, '/assets/images/covers/white-nights.jpg');
  assert.equal(books[0].description.es.startsWith('El viajante'), true);
  const bad = structuredClone(snapshot); bad.shelves.read[0].goodreads_url = 'javascript:alert(1)';
  assert.throws(() => normalizeBooks(bad));
});
