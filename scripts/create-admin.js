import { createInterface, emitKeypressEvents } from 'node:readline';
import { getDb } from '../lib/db.js';
import { loadLocalEnv } from '../lib/env.js';
import { hashPassword } from '../lib/passwords.js';
import { username as validateUsername } from '../lib/validation.js';

function question(prompt) {
  const rl = createInterface({ input: process.stdin, output: process.stdout });
  return new Promise(resolve => rl.question(prompt, answer => { rl.close(); resolve(answer); }));
}
function password(prompt) {
  process.stdout.write(prompt);
  emitKeypressEvents(process.stdin); process.stdin.setRawMode(true); process.stdin.resume();
  return new Promise((resolve, reject) => {
    let value = '';
    const finish = (error) => {
      process.stdin.off('keypress', onKey); process.stdin.setRawMode(false); process.stdin.pause();
      process.stdout.write('\n'); error ? reject(error) : resolve(value); value = '';
    };
    const onKey = (text, key = {}) => {
      if (key.ctrl && key.name === 'c') return finish(new Error('Cancelled'));
      if (key.name === 'return' || key.name === 'enter') return finish();
      if (key.name === 'backspace') value = [...value].slice(0, -1).join('');
      else if (key.ctrl && key.name === 'u') value = '';
      else if (text && !key.ctrl && !key.meta && !text.includes('\u001b') && value.length < 129) value += text;
    };
    process.stdin.on('keypress', onKey);
  });
}

loadLocalEnv();
try {
  if (process.argv.length > 2 || !process.stdin.isTTY || !process.stdout.isTTY) throw new Error('Run interactively with no arguments. Passwords are never accepted from argv or environment variables.');
  const db = getDb();
  const name = validateUsername(await question('Admin username (lowercase): '));
  const users = await db.query('SELECT id, username FROM admin_users');
  if (users.some(user => user.username !== name)) throw new Error('A different admin already exists. Use that username to reset its password.');
  let secret = await password('Password (12–128 characters, hidden): ');
  let confirmation = await password('Confirm password (hidden): ');
  if (secret !== confirmation) throw new Error('Passwords did not match');
  const hash = await hashPassword(secret); secret = ''; confirmation = '';
  await db.transaction([
    db.query('LOCK TABLE admin_users IN SHARE ROW EXCLUSIVE MODE'),
    db.query('INSERT INTO admin_users (username, password_hash) VALUES ($1, $2) ON CONFLICT (username) DO UPDATE SET password_hash = EXCLUDED.password_hash', [name, hash]),
    db.query('DELETE FROM sessions WHERE user_id = (SELECT id FROM admin_users WHERE username = $1)', [name]),
    db.query('DELETE FROM login_attempts WHERE username = $1', [name])
  ]);
  console.log('Admin saved. Existing sessions revoked.');
} catch (error) {
  console.error(error.message?.startsWith('Run interactively') || error.message?.startsWith('Use a password') || error.message?.startsWith('A different admin') || error.message === 'Passwords did not match' || error.message === 'Cancelled' ? error.message : 'Admin setup failed. Check the username, DATABASE_URL and migration. No credentials were logged.');
  process.exitCode = 1;
}
