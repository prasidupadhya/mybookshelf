import { randomBytes } from 'node:crypto';
import { existsSync, readFileSync, writeFileSync } from 'node:fs';

const path = new URL('../.env.local', import.meta.url);
const content = existsSync(path) ? readFileSync(path, 'utf8') : 'DATABASE_URL=\n';
if (/^SESSION_SECRET=.+/m.test(content)) {
  console.log('SESSION_SECRET is already set in .env.local; it was preserved.');
} else {
  const withoutEmpty = content.replace(/^SESSION_SECRET=.*\n?/m, '');
  writeFileSync(path, `${withoutEmpty.trimEnd()}\nSESSION_SECRET=${randomBytes(32).toString('hex')}\n`, { mode: 0o600 });
  console.log('Generated SESSION_SECRET in ignored .env.local. Copy it privately into Vercel; it was not printed.');
}
