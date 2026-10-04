import { test } from 'node:test';
import assert from 'node:assert/strict';
import { normalizeBooks } from '../public/assets/js/books-api.js';
import { getBookThickness, getReadableInk } from '../public/assets/js/book-appearance.js';
import { groupBooks } from '../lib/book-records.js';
import { fixtureBooks } from './database.js';

test('Database records preserve localized fields, proportions, colors and paper thickness', () => {
  const payload = groupBooks(fixtureBooks());
  const books = normalizeBooks(payload);
  assert.equal(books.length, 5);
  assert.equal(books[0].title.es, 'Edición de prueba 1');
  assert.equal(books[0].coverAspect, .625);
  assert.equal(books[0].backColor, books[0].spineColor);
  assert.equal(getBookThickness(100), 21);
  assert(getBookThickness(500) > getBookThickness(100));
  assert.equal(getReadableInk('#111111'), '#fff8e8');
  assert.equal(getReadableInk('#ffffff'), '#17110f');
  const bad = structuredClone(payload); bad.shelves.read[0].goodreads_url = 'javascript:alert(1)';
  assert.throws(() => normalizeBooks(bad));
  const duplicate = structuredClone(payload); duplicate.shelves.read[0].slug = duplicate.shelves.read[1].slug;
  assert.throws(() => normalizeBooks(duplicate));
});
