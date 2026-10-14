import { randomBytes, createHash } from 'node:crypto';
import { query } from './db.js';
const digest = token => createHash('sha256').update(token).digest('hex');
export async function issueSession(userId) {
  const token = randomBytes(32).toString('hex');
  await query('DELETE FROM sessions WHERE expires < ?', [Date.now()]);
  await query('INSERT INTO sessions (token,user_id,expires) VALUES (?,?,?)', [digest(token), userId, Date.now() + 28800000]);
  return token;
}
export async function sessionUser(token) {
  if (!token || !/^[a-f0-9]{64}$/.test(token)) return null;
  const rows = await query('SELECT u.id,u.name,u.email,u.role,u.active FROM users u JOIN sessions s ON s.user_id=u.id WHERE s.token=? AND s.expires>? AND u.active=1', [digest(token), Date.now()]);
  return rows[0] || null;
}
export async function revokeSession(token) { if (token) await query('DELETE FROM sessions WHERE token=?', [digest(token)]); }
