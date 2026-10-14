import test from 'node:test';
import assert from 'node:assert/strict';
import {createApi} from '../src/api.js';
test('La app envía Bearer, identificación móvil y JSON',async()=>{
 const previous=globalThis.fetch;
 try{globalThis.fetch=async(url,options)=>{assert.equal(url,'http://192.168.1.2:3000/api/orders');assert.equal(options.headers.Authorization,'Bearer token');assert.equal(options.headers['X-FixTrack-Client'],'mobile');assert.deepEqual(JSON.parse(options.body),{problem:'Falla'});return new Response(JSON.stringify({id:1}),{status:201});};assert.deepEqual(await createApi('http://192.168.1.2:3000','token')('orders','POST',{problem:'Falla'}),{id:1});}finally{globalThis.fetch=previous;}
});
test('Una sesión vencida se invalida y conserva el error del servidor',async()=>{
 const previous=globalThis.fetch;let revoked=false;
 try{globalThis.fetch=async()=>new Response(JSON.stringify({error:'Sesión vencida'}),{status:401});await assert.rejects(createApi('https://example.test','token',()=>{revoked=true;})('data'),/Sesión vencida/);assert.equal(revoked,true);}finally{globalThis.fetch=previous;}
});
test('Una respuesta HTML muestra un mensaje útil',async()=>{
 const previous=globalThis.fetch;
 try{globalThis.fetch=async()=>new Response('<html>Error</html>',{status:500});await assert.rejects(createApi('https://example.test',null)('data'),/no devolvió JSON/);}finally{globalThis.fetch=previous;}
});
