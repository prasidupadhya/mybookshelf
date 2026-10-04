import { neon } from '@neondatabase/serverless';
import { requiredEnv } from './env.js';

// HTTP queries avoid long-lived connections in serverless functions.
export function getDb() {
  return neon(requiredEnv('DATABASE_URL'), { fetchOptions: { signal: AbortSignal.timeout(10000) } });
}
