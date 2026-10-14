# Demostración y comprobación manual

Antes de grabar: iniciar backend y Expo; comprobar conectividad real. Crear un administrador y activar un técnico y una cuenta de recepción. Usar información ficticia, no datos reales de clientes.

## Recorrido sugerido — 10 a 12 minutos

1. **Presentación, 1 minuto:** problema del taller, continuidad con la web y objetivo del móvil.
2. **Acceso, 2 minutos:** mostrar correo inválido y confirmación de contraseña; registrar una cuenta y explicar la activación; ingresar.
3. **Recepción, 2 minutos:** registrar cliente y equipo; crear orden, describir falla y asignar técnico.
4. **Atención técnica, 3 minutos:** ingresar como técnico, mostrar órdenes asignadas, agregar diagnóstico, costo, trabajo y repuesto; avanzar estados.
5. **Pago y entrega, 2 minutos:** ingresar con recepción; intentar entregar con saldo, mostrar validación; registrar pago y entregar.
6. **Cierre, 1 minuto:** historial, actualización compartida con la web y explicación breve de Context API, REST, SecureStore y permisos en servidor.

## Comprobaciones en el dispositivo

- Login correcto, contraseña errónea y cuenta inactiva.
- Cerrar y abrir app: restauración de sesión válida.
- Logout y desactivación de usuario: el servidor rechaza el token.
- Retroceso de Android vuelve al detalle después de guardar un movimiento.
- El teclado no oculta el botón Guardar en pantallas pequeñas.
- Selector con búsqueda encuentra clientes y equipos.
- Técnico A no ve ni modifica órdenes del técnico B.
- El total coincide con servicio + cantidad × precio del repuesto.
- No se permiten sobrepagos ni entrega con deuda.
- Desconectar Wi-Fi muestra error y permite reintentar sin afirmar que guardó.
- El historial se conserva al reiniciar el backend.
- Comparar las pantallas contra el Figma real del equipo antes de declarar cumplimiento visual.

Estado: lista de comprobación preparada; aún no ejecutada en dispositivo desde esta sesión.
