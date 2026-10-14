import { randomBytes, createHash } from 'node:crypto';
import { cookies } from 'next/headers';
import { db } from './db.js';
export { hashPassword, verifyPassword } from './passwords.js';
const digest = token => createHash('sha256').update(token).digest('hex');
export async function currentUser() {
  const token = (await cookies()).get('fixtrack_session')?.value;
  if (!token) return null;
  return db().prepare('SELECT u.id,u.name,u.email,u.role,u.active FROM users u JOIN sessions s ON s.user_id=u.id WHERE s.token=? AND s.expires>? AND u.active=1').get(digest(token), Date.now()) || null;
}
export async function startSession(userId) {
  const token = randomBytes(32).toString('hex');
  db().prepare('DELETE FROM sessions WHERE expires < ?').run(Date.now());
  db().prepare('INSERT INTO sessions VALUES (?,?,?)').run(digest(token), userId, Date.now() + 8 * 3600000);
  (await cookies()).set('fixtrack_session', token, { httpOnly: true, secure: process.env.NODE_ENV === 'production', sameSite: 'lax', path: '/', maxAge: 28800 });
}
export async function endSession() {
  const jar = await cookies(); const token = jar.get('fixtrack_session')?.value;
  if (token) db().prepare('DELETE FROM sessions WHERE token=?').run(digest(token));
  jar.delete('fixtrack_session');
}
