import { existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

// CLI and local development only. Vercel provides its own environment variables.
export function loadLocalEnv() {
  const path = fileURLToPath(new URL('../.env.local', import.meta.url));
  if (existsSync(path)) process.loadEnvFile(path);
}

export function requiredEnv(name) {
  const value = process.env[name];
  if (!value || value.startsWith('replace-') || value.includes('YOUR-ENDPOINT')) throw new Error(`${name} is not configured`);
  return value;
}
