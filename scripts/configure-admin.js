import { writeFile } from 'node:fs/promises';
import { ADMIN_SLUG } from '../config/admin.js';
import { SECURITY_HEADERS } from '../config/security.js';

if (!/^[a-z][a-z0-9-]{2,63}$/.test(ADMIN_SLUG) || ['api', 'assets', 'admin'].includes(ADMIN_SLUG)) throw new Error('Choose a unique, lowercase admin slug');
const config = {
  $schema: 'https://openapi.vercel.sh/vercel.json',
  framework: null,
  outputDirectory: 'public',
  buildCommand: '',
  functions: { 'api/**/*.js': { maxDuration: 30 } },
  rewrites: [
    { source: `/${ADMIN_SLUG}`, destination: '/admin/index.html' },
    { source: `/${ADMIN_SLUG}/`, destination: '/admin/index.html' }
  ],
  headers: [
    { source: '/(.*)', headers: SECURITY_HEADERS },
    ...[`/${ADMIN_SLUG}`, `/${ADMIN_SLUG}/(.*)`, '/admin(.*)', '/api/admin/(.*)'].map(source => ({ source, headers: [{ key: 'X-Robots-Tag', value: 'noindex, nofollow' }, { key: 'Cache-Control', value: 'no-store' }] }))
  ]
};
await writeFile(new URL('../vercel.json', import.meta.url), JSON.stringify(config, null, 2) + '\n');
await writeFile(new URL('../public/robots.txt', import.meta.url), `User-agent: *\nDisallow: /${ADMIN_SLUG}\nDisallow: /admin\nDisallow: /api/admin/\n`);
console.log('Updated Vercel admin routes, headers and robots.txt.');
