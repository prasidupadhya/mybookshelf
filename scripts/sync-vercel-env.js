import { spawn } from 'node:child_process';
import { loadLocalEnv, requiredEnv } from '../lib/env.js';

loadLocalEnv();
try {
  for (const name of ['DATABASE_URL', 'SESSION_SECRET']) {
    const value = requiredEnv(name);
    if (name === 'DATABASE_URL' && !value.startsWith('postgresql://')) throw new Error('Invalid database configuration');
    if (name === 'SESSION_SECRET' && Buffer.byteLength(value) < 32) throw new Error('Invalid session configuration');
    // Secrets travel through stdin, never process arguments, shell interpolation, or console output.
    const status = await new Promise((resolve, reject) => {
      const child = spawn('npx', ['--yes', '--package=vercel@62.2.0', 'vercel', 'env', 'add', name, 'production,preview', '--sensitive', '--force', '--yes'], {
        cwd: new URL('../', import.meta.url), stdio: ['pipe', 'ignore', 'ignore'], signal: AbortSignal.timeout(45000)
      });
      child.on('error', reject); child.on('close', resolve); child.stdin.on('error', () => {});
      child.stdin.end(value);
    });
    if (status !== 0) throw new Error('Vercel configuration failed');
    console.log(`${name} saved privately in Vercel production and preview.`);
  }
} catch {
  console.error('Environment sync failed. Sign in with npx vercel login, link the existing project, and check .env.local. No values were printed.');
  process.exitCode = 1;
}
