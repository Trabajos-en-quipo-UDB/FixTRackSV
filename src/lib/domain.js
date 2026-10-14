export const STATES = ['Recibido', 'En diagnóstico', 'Esperando aprobación', 'En reparación', 'Reparado', 'Listo para entregar', 'Entregado', 'Cancelado'];
export const ROLES = ['Administrador', 'Recepcionista', 'Técnico'];
export function orderTotal(order, lines = []) {
  return Math.round((Number(order.service_cost || 0) + lines.filter(l => l.order_id === order.id).reduce((s, l) => s + l.quantity * l.unit_price, 0)) * 100) / 100;
}
export function orderPaid(order, payments = []) {
  return Math.round(payments.filter(p => p.order_id === order.id).reduce((s, p) => s + p.amount, 0) * 100) / 100;
}
export const money = value => new Intl.NumberFormat('es-SV', { style: 'currency', currency: 'USD' }).format(value || 0);
