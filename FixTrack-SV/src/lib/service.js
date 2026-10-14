import { all, one, insert, update, query, transaction } from './db.js';
import { STATES, ROLES, orderTotal, orderPaid } from './domain.js';
import { hashPassword } from './passwords.js';
export class AppError extends Error { constructor(message, status = 422) { super(message); this.status = status; } }
export const fail = (condition, message, status = 422) => { if (condition) throw new AppError(message, status); };
export function text(value, label, min = 1, max = 1000) {
  const v = String(value ?? '').trim(); fail(v.length < min || v.length > max, `${label}: debe tener entre ${min} y ${max} caracteres.`); return v;
}
function num(value, label, min = 0) { const n = Number(value); fail(value === '' || value == null || !Number.isFinite(n) || n < min || n > 1000000, `${label}: valor inválido.`); return Math.round(n * 100) / 100; }
async function ref(table, value) { const id = Number(value); fail(!Number.isSafeInteger(id) || !(await one(table, id)), 'El registro relacionado no existe.'); return id; }
const stamp = () => new Date().toISOString();
export async function snapshot(user) {
  const orders = (await all('orders')).filter(o => user.role !== 'Técnico' || o.technician_id === user.id);
  const ids = new Set(orders.map(o => o.id));
  const equipmentIds = new Set(orders.map(o => o.equipment_id));
  const equipment = (await all('equipment')).filter(e => user.role !== 'Técnico' || equipmentIds.has(e.id));
  const clientIds = new Set(equipment.map(e => e.client_id));
  return { user, orders, equipment, clients: (await all('clients')).filter(c => user.role !== 'Técnico' || clientIds.has(c.id)),
    users: (await all('users')).map(({ id, name, email, role, active }) => ({ id, name, email: user.role === 'Administrador' ? email : '', role, active })),
    parts: await all('parts'), diagnostics: (await all('diagnostics')).filter(r => ids.has(r.order_id)), lines: (await all('lines')).filter(r => ids.has(r.order_id)),
    payments: user.role === 'Técnico' ? [] : (await all('payments')).filter(r => ids.has(r.order_id)), history: (await all('history')).filter(r => ids.has(r.order_id)) };
}
export async function mutate(user, resource, method, id, body) {
  fail(!['clients','equipment','orders','diagnostics','parts','lines','payments','users'].includes(resource), 'Recurso no encontrado.', 404);
  const admin = user.role === 'Administrador'; const technician = user.role === 'Técnico';
  fail(resource === 'users' && !admin, 'Acceso exclusivo de administración.', 403);
  fail(technician && !['orders','diagnostics','lines'].includes(resource), 'Tu rol no permite esta operación.', 403);
  fail(resource === 'parts' && !admin, 'Solo administración modifica el catálogo.', 403);
  return transaction(async () => {
    const existing = id ? await one(resource, id) : null;
    fail(id && !existing, 'Registro no encontrado.', 404);
    if (method === 'DELETE') {
      fail(!admin && !['clients','equipment'].includes(resource), 'No tenés permiso para eliminar este registro.', 403);
      fail(!['clients','equipment','parts'].includes(resource), 'Este registro se conserva como historial; no se permite eliminarlo.');
      await query(`DELETE FROM \`${resource}\` WHERE id=?`, [id]); return { ok: true };
    }
    fail(method === 'POST' && id || method === 'PATCH' && !id, 'Operación inválida.');
    let data = {};
    if (resource === 'clients') {
      data = { name: text(body.name, 'Nombre', 2, 100), phone: text(body.phone, 'Teléfono', 8, 25), email: text(body.email, 'Correo', 0, 150), address: text(body.address, 'Dirección', 0, 300) };
      fail(!/^[+\d\s()-]+$/.test(data.phone), 'Teléfono inválido.');
      fail(data.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email), 'Correo inválido.');
    }
    if (resource === 'equipment') data = { client_id: await ref('clients', body.client_id), type: text(body.type, 'Tipo', 2, 50), brand: text(body.brand, 'Marca', 1, 60), model: text(body.model, 'Modelo', 1, 80), serial: text(body.serial, 'Serie', 0, 100), notes: text(body.notes, 'Características', 0, 1000) };
    if (resource === 'parts') data = { name: text(body.name, 'Repuesto', 2, 100), sku: text(body.sku, 'Código', 0, 60), price: num(body.price, 'Precio') };
    if (resource === 'users') {
      fail(!id, 'Utilizá el formulario de registro para crear una cuenta.');
      fail(!ROLES.includes(body.role), 'Rol inválido.');
      fail(id === user.id && (body.role !== 'Administrador' || !body.active), 'No podés quitarte tu propio acceso administrativo.');
      data = { role: body.role, active: body.active ? 1 : 0 };
      if (body.password) { const p = text(body.password, 'Contraseña', 10, 128); data.password = hashPassword(p); }
      await query('DELETE FROM sessions WHERE user_id=?', [id]);
    }
    if (resource === 'orders') {
      fail(technician && (!existing || existing.technician_id !== user.id), 'Solo podés modificar órdenes asignadas a vos.', 403);
      if (!existing) {
        fail(technician, 'No podés crear órdenes.', 403);
        data = { code: `FT-${Date.now()}-${Math.random().toString(36).slice(2,6).toUpperCase()}`, equipment_id: await ref('equipment', body.equipment_id), technician_id: body.technician_id ? await ref('users', body.technician_id) : null, problem: text(body.problem, 'Falla reportada', 5, 2000), priority: body.priority || 'Normal', status: STATES[0], service_cost: 0, created_at: stamp(), updated_at: stamp() };
      } else {
        fail(['Entregado','Cancelado'].includes(existing.status), 'La orden está cerrada y se conserva como historial.');
        data = { status: body.status || existing.status, service_cost: body.service_cost === undefined ? existing.service_cost : num(body.service_cost, 'Costo de servicio'), updated_at: stamp() };
        if (!technician) { data.technician_id = body.technician_id ? await ref('users', body.technician_id) : null; data.priority = body.priority || existing.priority; }
        fail(!STATES.includes(data.status), 'Estado inválido.');
        if (data.status !== existing.status) {
          fail(technician && ['Entregado','Cancelado'].includes(data.status), 'La recepción o administración gestiona la entrega y cancelación.', 403);
          fail(data.status !== 'Cancelado' && STATES.indexOf(data.status) !== STATES.indexOf(existing.status) + 1, 'Avanzá al siguiente estado del proceso.');
          const payments = await all('payments'); const lines = await all('lines');
          fail(data.status === 'Cancelado' && orderPaid(existing, payments) > 0, 'La orden tiene pagos registrados; no se puede cancelar sin conciliarlos.');
          fail(data.status === 'Entregado' && orderPaid(existing, payments) + 0.001 < orderTotal({...existing, ...data}, lines), 'Registrá el pago del saldo antes de entregar.');
          const note = text(body.note, 'Motivo', data.status === 'Cancelado' ? 5 : 0, 500);
          await insert('history', { order_id: id, user_id: user.id, previous: existing.status, next: data.status, note, created_at: stamp() });
        }
        fail(orderTotal({...existing, ...data}, await all('lines')) + 0.001 < orderPaid(existing, await all('payments')), 'El total no puede quedar por debajo de los pagos registrados.');
      }
      if (data.technician_id) { const t = await one('users', data.technician_id); fail(t.role !== 'Técnico' || !t.active, 'Seleccioná un técnico activo.'); }
      fail(data.priority && !['Baja','Normal','Alta','Urgente'].includes(data.priority), 'Prioridad inválida.');
    }
    if (['diagnostics','lines','payments'].includes(resource)) {
      fail(id, 'Estos movimientos no se sobrescriben.');
      const orderId = await ref('orders', body.order_id); const order = await one('orders', orderId);
      fail(technician && order.technician_id !== user.id, 'Orden no asignada a tu cuenta.', 403);
      fail(['Entregado','Cancelado'].includes(order.status), 'La orden está cerrada.');
      if (resource === 'diagnostics') {
        fail(user.role === 'Recepcionista', 'El diagnóstico corresponde al técnico.', 403);
        data = { order_id: orderId, user_id: user.id, finding: text(body.finding, 'Diagnóstico', 5, 3000), work: text(body.work, 'Trabajo realizado', 0, 3000), created_at: stamp() };
      }
      if (resource === 'lines') {
        fail(user.role === 'Recepcionista', 'Los repuestos utilizados los registra el técnico.', 403);
        const quantity = num(body.quantity, 'Cantidad', 1); fail(!Number.isInteger(quantity), 'La cantidad debe ser un número entero.');
        const partId = await ref('parts', body.part_id); data = { order_id: orderId, part_id: partId, quantity, unit_price: (await one('parts', partId)).price };
      }
      if (resource === 'payments') {
        const amount = num(body.amount, 'Monto', 0.01);
        fail(amount > orderTotal(order, await all('lines')) - orderPaid(order, await all('payments')) + 0.001, 'El pago supera el saldo pendiente.');
        fail(!['Efectivo','Transferencia','Tarjeta'].includes(body.method), 'Método inválido.');
        data = { order_id: orderId, amount, method: body.method, reference: text(body.reference, 'Referencia', 0, 150), created_at: stamp() };
      }
    }
    if (id) await update(resource, id, data); else id = await insert(resource, data);
    if (resource === 'orders' && method === 'POST') await insert('history', { order_id: id, user_id: user.id, previous: '', next: 'Recibido', note: 'Recepción del equipo', created_at: stamp() });
    return { ok: true, id };
  });
}
