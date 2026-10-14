import test from 'node:test';
import assert from 'node:assert/strict';
import {normalizeUrl,validateAuth,nextStates,total,paid} from '../src/domain.mjs';
test('Direcciones: permite LAN y HTTPS; rechaza credenciales, rutas y HTTP público',()=>{
 assert.equal(normalizeUrl(' http://192.168.1.20:3000/ '),'http://192.168.1.20:3000');
 assert.equal(normalizeUrl('https://taller.example'),'https://taller.example');
 for(const x of ['javascript:alert(1)','http://example.com','https://a:b@site.com','https://site.com/api','https://site.com/?token=x'])assert.throws(()=>normalizeUrl(x));
});
test('Registro: correo, longitud y confirmación',()=>{
 const valid={email:'usuario@example.com',name:'Técnico',password:'contraseña-123',confirm:'contraseña-123'};
 assert.equal(validateAuth(valid,true),'');
 for(const v of [{email:'mal'},{name:'A'},{password:'corta'},{confirm:'diferente'}])assert.notEqual(validateAuth({...valid,...v},true),'');
});
test('Técnico no puede entregar ni cancelar; orden cerrada no tiene transiciones',()=>{
 assert.deepEqual(nextStates({status:'Listo para entregar'},'Técnico'),['Listo para entregar']);
 assert.deepEqual(nextStates({status:'Entregado'},'Administrador'),[]);
 assert.deepEqual(nextStates({status:'Cancelado'},'Administrador'),[]);
 assert.ok(nextStates({status:'Listo para entregar'},'Recepcionista').includes('Entregado'));
});
test('Total y pago se calculan solo para la orden actual',()=>{
 const order={id:1,service_cost:25};const lines=[{order_id:1,quantity:2,unit_price:10.25},{order_id:2,quantity:1,unit_price:300}];
 assert.equal(total(order,lines),45.5);assert.equal(paid(order,[{order_id:1,amount:10},{order_id:2,amount:40}]),10);
});
