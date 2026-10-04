import { test, mock } from 'node:test';
import assert from 'node:assert/strict';
import { randomBytes, createHash } from 'node:crypto';
import { testDatabase, request } from './database.js';
import { hashPassword, verifyPassword } from '../lib/passwords.js';

test('Postgres migrations, authentication, CSRF, persistence and shelf operations', async () => {
  process.env.SESSION_SECRET = randomBytes(32).toString('hex');
  const { db, pg } = await testDatabase();
  mock.module('../lib/db.js', { namedExports: { getDb: () => db } });
  const names = ['books', 'admin/login', 'admin/logout', 'admin/me', 'admin/books/index', 'admin/books/[id]', 'admin/books/reorder'];
  const handlers = Object.fromEntries(await Promise.all(names.map(async name => [name, (await import(`../api/${name}.js`)).default])));
  try {
    const hash = await hashPassword('A test-only password 123!');
    assert(await verifyPassword('A test-only password 123!', hash));
    assert.equal(await verifyPassword('wrong password', hash), false);
    await db.query('INSERT INTO admin_users (username, password_hash) VALUES ($1, $2)', ['prasid', hash]);

    for (const name of names.filter(name => name.startsWith('admin/') && name !== 'admin/login')) {
      assert.equal((await request(handlers[name], { method: name.includes('[id]') ? 'DELETE' : name.endsWith('me') ? 'GET' : 'POST' })).status, 401, name);
    }
    const login = body => request(handlers['admin/login'], { method: 'POST', body });
    assert.equal((await request(handlers['admin/login'], { method: 'POST', csrf: false, body: { username: 'prasid', password: 'x' } })).status, 403);
    const unknown = await login({ username: 'unknown', password: 'wrong password' });
    const wrong = await login({ username: 'prasid', password: 'wrong password' });
    assert.equal(wrong.status, 401); assert.deepEqual(wrong.body, unknown.body);
    const success = await login({ username: 'PRASID', password: 'A test-only password 123!' });
    assert.equal(success.status, 200);
    const cookie = success.headers['set-cookie'].split(';')[0];
    assert.match(success.headers['set-cookie'], /HttpOnly; Secure; SameSite=Strict; Path=\/; Max-Age=604800/);
    const raw = cookie.split('=')[1].split('.')[0];
    const [session] = await db.query('SELECT * FROM sessions');
    assert.equal(session.token_hash, createHash('sha256').update(raw).digest('hex'));
    assert.equal(JSON.stringify(session).includes(raw), false);
    assert.equal((await request(handlers['admin/me'], { cookie })).status, 200);
    assert.equal((await request(handlers['admin/me'], { cookie: cookie.slice(0, -1) + (cookie.endsWith('A') ? 'B' : 'A') })).status, 401);
    for (let i = 0; i < 4; i++) assert.equal((await login({ username: 'prasid', password: 'wrong password' })).status, 401);
    const locked = await login({ username: 'prasid', password: 'A test-only password 123!' });
    assert.equal(locked.status, 429); assert.deepEqual(locked.body, wrong.body);
    await db.query("UPDATE login_attempts SET attempted_at = now() - interval '16 minutes'");
    assert.equal((await login({ username: 'prasid', password: 'A test-only password 123!' })).status, 200);

    const publicResult = await request(handlers.books);
    assert.equal(Object.values(publicResult.body.shelves).flat().length, 5);
    assert.match(publicResult.headers['cache-control'], /s-maxage=60, stale-while-revalidate=300/);
    assert.equal('created_at' in publicResult.body.shelves.read[0], false);
    assert.equal((await request(handlers['admin/books/index'], { method: 'POST', cookie, csrf: false, body: {} })).status, 403);
    for (const bad of [{ spine_color: 'red' }, { cover_url: 'javascript:alert(1)' }, { title: 7 }, { page_count: -1 }, { cover_texture_url: '//evil.com/a.jpg' }, { shelf: 'other' }]) {
      assert.equal((await request(handlers['admin/books/index'], { method: 'POST', cookie, body: { slug: 'bad-book', title: 'Bad', author: 'A', shelf: 'read', ...bad } })).status, 400);
    }
    const created = await request(handlers['admin/books/index'], { method: 'POST', cookie, body: { slug: 'test-book', title: '<script>safe text</script>', author: 'Test author', shelf: 'want_to_read', page_count: 300, spine_color: '#236547', title_es: 'Libro de prueba', description_en: 'English', description_es: 'Español' } });
    assert.equal(created.status, 201); const id = created.body.book.id;
    const edit = (body) => request(handlers['admin/books/[id]'], { method: 'PATCH', cookie, id, body });
    assert.equal((await edit({ title: 'Edited', shelf: 'currently_reading' })).status, 200);
    let [book] = await db.query('SELECT * FROM books WHERE id = $1', [id]);
    assert.equal(book.title, 'Edited'); assert(book.started_at);
    assert.equal((await edit({ shelf: 'read' })).status, 200);
    [book] = await db.query('SELECT * FROM books WHERE id = $1', [id]); assert(book.finished_at);
    assert.equal((await edit({ finished_at: '2000-01-01T00:00:00Z' })).status, 400);
    const rows = await db.query("SELECT id FROM books WHERE shelf = 'read' ORDER BY sort_order");
    const ids = rows.map(book => book.id).reverse();
    assert.equal((await request(handlers['admin/books/reorder'], { method: 'POST', cookie, body: { shelf: 'read', ids } })).status, 200);
    assert.deepEqual((await db.query("SELECT id FROM books WHERE shelf = 'read' ORDER BY sort_order")).map(book => book.id), ids);
    assert.equal((await request(handlers['admin/books/reorder'], { method: 'POST', cookie, body: { shelf: 'read', ids: ids.slice(1) } })).status, 409);
    assert.equal((await request(handlers['admin/books/[id]'], { method: 'DELETE', cookie, id })).status, 200);
    assert.equal((await db.query('SELECT id FROM books WHERE id = $1', [id])).length, 0);
    assert.equal((await request(handlers['admin/logout'], { method: 'POST', cookie })).status, 200);
    assert.equal((await request(handlers['admin/me'], { cookie })).status, 401);
    const again = await login({ username: 'prasid', password: 'A test-only password 123!' });
    await db.query("UPDATE sessions SET expires_at = now() - interval '1 minute'");
    assert.equal((await request(handlers['admin/me'], { cookie: again.headers['set-cookie'].split(';')[0] })).status, 401);
    const count = await db.query('SELECT count(*) AS count FROM books'); assert.equal(Number(count[0].count), 5);
  } finally { mock.reset(); await pg.close(); }
});
