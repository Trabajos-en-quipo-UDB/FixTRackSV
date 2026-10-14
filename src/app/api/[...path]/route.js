import { NextResponse } from 'next/server';
import { currentUser, startSession, endSession, hashPassword, verifyPassword } from '@/lib/auth';
import { db, insert, transaction } from '@/lib/db';
import { snapshot, mutate, fail, text, AppError } from '@/lib/service';
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
async function handle(request, context) {
  try {
    const { path } = await context.params; const [resource, action] = path;
    fail(path.length > 2, 'Ruta inexistente.', 404);
    const method = request.method;
    if (method !== 'GET') {
      const origin = request.headers.get('origin');
      fail(origin && origin !== new URL(request.url).origin, 'Origen no permitido.', 403);
      fail(request.headers.get('sec-fetch-site') === 'cross-site', 'Solicitud no permitida.', 403);
    }
    let body = {};
    if (['POST','PATCH'].includes(method)) {
      fail(Number(request.headers.get('content-length') || 0) > 20000, 'Solicitud demasiado grande.', 413);
      const raw = await request.text(); fail(raw.length > 20000, 'Solicitud demasiado grande.', 413);
      try { body = JSON.parse(raw); } catch { throw new AppError('JSON inválido.', 400); }
      fail(!body || Array.isArray(body) || typeof body !== 'object', 'Solicitud inválida.', 400);
    }
    if (resource === 'auth') {
      if (action === 'logout' && method === 'POST') { await endSession(); return NextResponse.json({ ok: true }); }
      if (action === 'me' && method === 'GET') return NextResponse.json({ user: await currentUser() });
      fail(method !== 'POST' || !['login','register'].includes(action), 'Ruta inexistente.', 404);
      const email = text(body.email, 'Correo', 5, 150).toLowerCase();
      fail(!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email), 'Correo inválido.');
      const password = text(body.password, 'Contraseña', action === 'register' ? 10 : 1, 128);
      if (action === 'register') {
        const name = text(body.name, 'Nombre', 2, 100);
        const account = transaction(() => {
          fail(db().prepare('SELECT id FROM users WHERE email=?').get(email), 'El correo ya está registrado.', 409);
          const first = db().prepare('SELECT count(*) AS n FROM users').get().n === 0;
          const id = insert('users', { name, email, password: hashPassword(password), role: first ? 'Administrador' : 'Técnico', active: first ? 1 : 0 });
          return { id, first };
        });
        if (account.first) await startSession(account.id);
        return NextResponse.json({ ok: true, pending: !account.first }, { status: 201 });
      }
      const attempt = db().prepare('SELECT * FROM login_attempts WHERE key=?').get(email);
      fail(attempt?.blocked_until > Date.now(), 'Demasiados intentos. Intentá nuevamente en 15 minutos.', 429);
      const user = db().prepare('SELECT * FROM users WHERE email=?').get(email);
      const valid = user ? verifyPassword(password, user.password) : verifyPassword(password, hashPassword('dummy-password-for-timing'));
      if (!valid || !user?.active) {
        const failures = (attempt?.blocked_until && attempt.blocked_until <= Date.now() ? 0 : attempt?.failures || 0) + 1;
        db().prepare('INSERT INTO login_attempts VALUES (?,?,?) ON CONFLICT(key) DO UPDATE SET failures=excluded.failures,blocked_until=excluded.blocked_until').run(email, failures, failures >= 5 ? Date.now() + 900000 : 0);
        throw new AppError('Credenciales incorrectas o cuenta pendiente de activación.', 401);
      }
      db().prepare('DELETE FROM login_attempts WHERE key=?').run(email);
      await startSession(user.id); return NextResponse.json({ ok: true });
    }
    const user = await currentUser(); fail(!user, 'Iniciá sesión para continuar.', 401);
    if (resource === 'data' && method === 'GET') return NextResponse.json(snapshot(user), { headers: { 'Cache-Control': 'no-store' } });
    fail(!['POST','PATCH','DELETE'].includes(method), 'Método no permitido.', 405);
    const id = action ? Number(action) : null; fail(action && (!Number.isSafeInteger(id) || id < 1), 'Identificador inválido.');
    return NextResponse.json(mutate(user, resource, method, id, body), { status: method === 'POST' ? 201 : 200 });
  } catch (error) {
    const constraint = /FOREIGN KEY/.test(error.message);
    if (!error.status && !constraint) console.error(error);
    return NextResponse.json({ error: constraint ? 'No se puede eliminar: hay registros vinculados.' : error.status ? error.message : 'No se pudo completar la operación. Revisá la configuración del servidor.' }, { status: constraint ? 409 : error.status || 500 });
  }
}
export { handle as GET, handle as POST, handle as PATCH, handle as DELETE };
