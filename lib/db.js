import { neon } from '@neondatabase/serverless';
import { requiredEnv } from './env.js';

// HTTP queries avoid long-lived connections in serverless functions.
export function getDb() {
  const sql = neon(requiredEnv('DATABASE_URL'));
  // Start deadlines when a query/transaction is issued, not when an interactive CLI starts.
  return {
    query: (text, values = []) => sql.query(text, values, { fetchOptions: { signal: AbortSignal.timeout(10000) } }),
    transaction: queries => sql.transaction(queries, { fetchOptions: { signal: AbortSignal.timeout(10000) } })
  };
}
