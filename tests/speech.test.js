import { test, mock } from 'node:test';
import assert from 'node:assert/strict';
import { testDatabase, request } from './database.js';

test('Narration is generated once per description, stored, regenerated on edit and never exposes the key', async () => {
  process.env.ELEVENLABS_API_KEY = 'test-only-elevenlabs-key';
  const upstream = [];
  const realFetch = globalThis.fetch;
  let failUpstream = false;
  globalThis.fetch = async (url, init) => {
    if (!String(url).startsWith('https://api.elevenlabs.io/')) return realFetch(url, init);
    upstream.push({ url: String(url), body: JSON.parse(init.body), key: init.headers['xi-api-key'] });
    if (failUpstream) return new Response('{"detail":"quota exceeded for test-only-elevenlabs-key"}', { status: 401 });
    return new Response(Buffer.from([0x49, 0x44, 0x33, 4, 5, 6]), { status: 200, headers: { 'content-type': 'audio/mpeg' } });
  };
  const { db } = await testDatabase();
  mock.module('../lib/db.js', { namedExports: { getDb: () => db } });
  const handler = (await import('../api/books/[id]/speech.js')).default;
  try {
    const idOf = async slug => (await db.query('SELECT id FROM books WHERE slug = $1', [slug]))[0].id;
    const first = await idOf('fixture-book-1');

    const english = await request(handler, { id: first, query: { lang: 'en' } });
    assert.equal(english.status, 200); assert.equal(english.headers['content-type'], 'audio/mpeg');
    assert.match(english.headers['cache-control'], /s-maxage=300/);
    assert.equal(upstream.length, 1);
    assert.equal(upstream[0].body.text, 'An English test description.');
    assert.equal(upstream[0].body.model_id, 'eleven_multilingual_v2');
    assert.equal(upstream[0].key, 'test-only-elevenlabs-key');
    assert.ok(!JSON.stringify(english.headers).includes('test-only-elevenlabs-key'));

    // A repeat listen is served from the database: no new provider request, same audio.
    const again = await request(handler, { id: first, query: { lang: 'en' } });
    assert.equal(upstream.length, 1); assert.deepEqual(again.body, english.body);

    const spanish = await request(handler, { id: first, query: { lang: 'es' } });
    assert.equal(spanish.status, 200); assert.equal(upstream.length, 2);
    assert.equal(upstream[1].body.text, 'Una descripción de prueba.');

    // Editing a description makes its next listen regenerate, never replay the old clip.
    await db.query("UPDATE books SET description_en = 'A changed description.' WHERE id = $1", [first]);
    await request(handler, { id: first, query: { lang: 'en' } });
    assert.equal(upstream.length, 3); assert.equal(upstream[2].body.text, 'A changed description.');

    // Invalid requests never reach the provider.
    assert.equal((await request(handler, { id: first, query: { lang: 'fr' } })).status, 400);
    assert.equal((await request(handler, { id: 'bad', query: { lang: 'en' } })).status, 400);
    assert.equal((await request(handler, { id: '00000000-0000-0000-0000-000000000000', query: { lang: 'en' } })).status, 404);
    await db.query("UPDATE books SET description_en = '   ' WHERE slug = 'fixture-book-2'");
    assert.equal((await request(handler, { id: await idOf('fixture-book-2'), query: { lang: 'en' } })).status, 404);
    assert.equal(upstream.length, 3);

    // A provider failure is reported generically, without its message or the key.
    failUpstream = true;
    const failed = await request(handler, { id: await idOf('fixture-book-3'), query: { lang: 'en' } });
    assert.equal(failed.status, 503);
    assert.ok(!JSON.stringify(failed.body).includes('test-only-elevenlabs-key'));
    assert.ok(!JSON.stringify(failed.body).includes('quota'));
  } finally {
    globalThis.fetch = realFetch;
    delete process.env.ELEVENLABS_API_KEY;
  }
});
