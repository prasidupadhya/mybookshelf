import { lookup } from 'node:dns/promises';
import { isIP } from 'node:net';
import { request as httpsRequest } from 'node:https';
import { request as httpRequest } from 'node:http';
import { HttpError } from './http.js';

const MAX_BYTES = 2 * 1024 * 1024;
export function publicIPv4(address) {
  if (isIP(address) !== 4) return false;
  const [a, b, c] = address.split('.').map(Number);
  return !(a === 0 || a === 10 || a === 127 || a >= 224
    || (a === 100 && b >= 64 && b <= 127) || (a === 169 && b === 254)
    || (a === 172 && b >= 16 && b <= 31)
    || (a === 192 && (b === 168 || (b === 0 && (c === 0 || c === 2)) || (b === 88 && c === 99)))
    || (a === 198 && (b === 18 || b === 19 || (b === 51 && c === 100))) || (a === 203 && b === 0 && c === 113));
}

export async function fetchCoverImage(value, redirects = 0, signal = AbortSignal.timeout(8000)) {
  let url;
  try { url = new URL(value); } catch { throw new HttpError(400, 'Use a valid cover URL'); }
  if (!['http:', 'https:'].includes(url.protocol) || url.username || url.password || url.port && !['80', '443'].includes(url.port) || url.hostname.startsWith('[') || isIP(url.hostname) === 6) throw new HttpError(400, 'Use a public http(s) cover URL');
  const addresses = isIP(url.hostname) === 4 ? [{ address: url.hostname }] : await lookup(url.hostname, { family: 4, all: true });
  if (!addresses.length || addresses.some(({ address }) => !publicIPv4(address))) throw new HttpError(400, 'Use a public image host');
  // Pin the validated address for the actual connection; redirects repeat validation.
  // No cookies, user credentials, or incoming headers are forwarded to the image host.
  const result = await new Promise((resolve, reject) => {
    const send = url.protocol === 'https:' ? httpsRequest : httpRequest;
    const request = send(url, {
      family: 4, autoSelectFamily: false, agent: false,
      lookup: (_host, _options, callback) => callback(null, addresses[0].address, 4),
      headers: { Accept: 'image/jpeg,image/png,image/webp', 'Accept-Encoding': 'identity', 'User-Agent': 'BookshelfCover/1.0' },
      signal
    }, response => {
      if ([301, 302, 303, 307, 308].includes(response.statusCode)) {
        response.resume(); return resolve({ redirect: response.headers.location });
      }
      const type = (response.headers['content-type'] || '').split(';')[0].trim().toLowerCase();
      if (response.statusCode !== 200 || !['image/jpeg', 'image/png', 'image/webp'].includes(type) || Number(response.headers['content-length']) > MAX_BYTES) {
        response.resume(); return reject(new HttpError(400, 'Use a JPEG, PNG or WebP cover smaller than 2 MB'));
      }
      const chunks = []; let bytes = 0;
      response.on('data', chunk => {
        bytes += chunk.length;
        if (bytes > MAX_BYTES) { request.destroy(); reject(new HttpError(400, 'Cover must be smaller than 2 MB')); }
        else chunks.push(chunk);
      });
      response.on('error', reject); response.on('end', () => resolve({ bytes: Buffer.concat(chunks), type }));
    });
    request.on('error', reject); request.end();
  });
  if ('redirect' in result) {
    if (!result.redirect || redirects >= 3) throw new HttpError(400, 'Cover has too many redirects');
    return fetchCoverImage(new URL(result.redirect, url).href, redirects + 1, signal);
  }
  const bytes = result.bytes;
  const jpeg = bytes[0] === 0xff && bytes[1] === 0xd8;
  const png = bytes.subarray(0, 8).equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]));
  const webp = bytes.subarray(0, 4).toString() === 'RIFF' && bytes.subarray(8, 12).toString() === 'WEBP';
  if (!(result.type === 'image/jpeg' && jpeg || result.type === 'image/png' && png || result.type === 'image/webp' && webp)) throw new HttpError(400, 'The URL did not return a supported cover image');
  return result;
}
