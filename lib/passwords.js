import { randomBytes, scrypt as derive, timingSafeEqual } from 'node:crypto';
import { promisify } from 'node:util';

const scrypt = promisify(derive);
const OPTIONS = { N: 131072, r: 8, p: 1, maxmem: 192 * 1024 * 1024 };
const PREFIX = 'scrypt$131072$8$1';

export async function hashPassword(password) {
  if (typeof password !== 'string' || password.length < 12 || password.length > 128) throw new Error('Use a password between 12 and 128 characters');
  const salt = randomBytes(16);
  const hash = await scrypt(password, salt, 32, OPTIONS);
  return `${PREFIX}$${salt.toString('hex')}$${hash.toString('hex')}`;
}

export async function verifyPassword(password, encoded) {
  const parts = String(encoded).split('$');
  if (parts.slice(0, 4).join('$') !== PREFIX || !/^[a-f0-9]{32}$/.test(parts[4] || '') || !/^[a-f0-9]{64}$/.test(parts[5] || '')) return false;
  const hash = await scrypt(password, Buffer.from(parts[4], 'hex'), 32, OPTIONS);
  return timingSafeEqual(hash, Buffer.from(parts[5], 'hex'));
}

// Precomputed with the same parameters. Unknown users still perform one full password derivation.
export const DUMMY_HASH = 'scrypt$131072$8$1$8f6ff1f8cf261aef157797f6855926a4$5c3bc33d42c04d3b27ce140389288b0660e3ed95723ca1ab63717b17c9ec2f99';
