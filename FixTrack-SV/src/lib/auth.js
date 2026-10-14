import { cookies, headers } from 'next/headers';
import { issueSession, sessionUser, revokeSession } from './sessions.js';
export { hashPassword, verifyPassword } from './passwords.js';
async function requestToken() {
  const authorization = (await headers()).get('authorization');
  if (authorization) return authorization.startsWith('Bearer ') ? authorization.slice(7) : '';
  return (await cookies()).get('fixtrack_session')?.value;
}
export async function currentUser() {
  return sessionUser(await requestToken());
}
export async function startSession(userId, mobile = false) {
  const token = await issueSession(userId);
  if (!mobile) (await cookies()).set('fixtrack_session', token, { httpOnly: true, secure: process.env.NODE_ENV === 'production', sameSite: 'lax', path: '/', maxAge: 28800 });
  return mobile ? token : undefined;
}
export async function endSession() {
  await revokeSession(await requestToken());
  if (!(await headers()).get('authorization')) (await cookies()).delete('fixtrack_session');
}
