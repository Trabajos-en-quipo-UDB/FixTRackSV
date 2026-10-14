export const STATES=['Recibido','En diagnóstico','Esperando aprobación','En reparación','Reparado','Listo para entregar','Entregado','Cancelado'];
export const ROLES=['Administrador','Recepcionista','Técnico'];
export const money=n=>'$'+Number(n||0).toFixed(2);
export const total=(o,lines)=>Math.round((Number(o.service_cost)+lines.filter(l=>l.order_id===o.id).reduce((s,l)=>s+l.quantity*l.unit_price,0))*100)/100;
export const paid=(o,payments)=>Math.round(payments.filter(p=>p.order_id===o.id).reduce((s,p)=>s+p.amount,0)*100)/100;
export function nextStates(order,role) {
  if(['Entregado','Cancelado'].includes(order.status))return [];
  return [order.status,STATES[STATES.indexOf(order.status)+1],...(role==='Técnico'?[]:['Cancelado'])].filter(s=>s&&(role!=='Técnico'||s!=='Entregado'));
}
export function validateAuth(values,register) {
  if(!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(values.email.trim()))return 'Escribí un correo válido.';
  if(values.password.length<(register?10:1))return register?'La contraseña necesita al menos 10 caracteres.':'Ingresá tu contraseña.';
  if(register&&values.name.trim().length<2)return 'Ingresá tu nombre completo.';
  if(register&&values.password!==values.confirm)return 'Las contraseñas no coinciden.';
  return '';
}
export function normalizeUrl(value) {
  let url;
  try { url=new URL(value.trim()); } catch { throw new Error('Usá una dirección como http://192.168.1.20:3000'); }
  if(!['http:','https:'].includes(url.protocol)||url.username||url.password||url.search||url.hash||!['','/'].includes(url.pathname))throw new Error('Ingresá solo la dirección base del servidor, sin rutas ni credenciales.');
  const local=/^(localhost|127\.0\.0\.1|10\.\d+\.\d+\.\d+|192\.168\.\d+\.\d+|172\.(1[6-9]|2\d|3[01])\.\d+\.\d+)$/.test(url.hostname);
  if(url.protocol==='http:'&&!local)throw new Error('Para un servidor público se requiere HTTPS.');
  return url.origin;
}
