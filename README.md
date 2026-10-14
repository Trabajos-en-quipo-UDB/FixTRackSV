# FixTrack SV

Sistema web para gestionar un taller de reparación de computadoras. Implementación de la etapa web de DPS: React, Next.js, Context API, API REST y SQLite local.

## Ejecutar

Requisito: Node.js 24 LTS (usa node:sqlite). Desde esta carpeta:

```sh
npm ci
npm run dev
```

Abrir http://localhost:3000. Crear la primera cuenta desde la pantalla inicial: será administradora. Las siguientes cuentas se registran como técnicos inactivos; el administrador debe activarlas y asignar su rol en Usuarios. No hay contraseñas predeterminadas ni datos ficticios precargados.

```sh
npm run lint
npm run build
npm start
```

La aplicación mantiene los datos en `data/fixtrack.sqlite`. La variable `FIXTRACK_DB` permite cambiar la ruta. Respaldar la base con el servidor detenido, incluyendo los archivos SQLite auxiliares si existen. No subir bases de datos ni credenciales a GitHub.

## Flujo de demostración

1. Crear la cuenta administradora.
2. Registrar otra cuenta en una sesión independiente y activarla como Técnico desde Usuarios. Una tercera puede ser Recepcionista.
3. Registrar un cliente y su equipo.
4. Crear una orden y asignarla al técnico.
5. Registrar diagnóstico y trabajo realizado; agregar repuestos desde el catálogo.
6. Definir el costo del servicio y avanzar por los estados.
7. Registrar pagos, comprobar el saldo y entregar el equipo.
8. Consultar el historial del equipo y exportar un reporte CSV.

Estados: Recibido → En diagnóstico → Esperando aprobación → En reparación → Reparado → Listo para entregar → Entregado. Cancelación con motivo, únicamente cuando no existan pagos registrados. La aprobación es un registro operativo del taller, no una aprobación digital del cliente.

## Roles

- Administrador: todos los módulos, activación de cuentas, roles y catálogo de repuestos.
- Recepcionista: clientes, equipos, recepción y seguimiento de órdenes, registro de pagos, entrega y reportes.
- Técnico: únicamente sus órdenes, diagnóstico, trabajo realizado, costo de servicio y repuestos utilizados. No puede entregar, cancelar ni registrar pagos.

## Reglas implementadas

- Claves foráneas: equipos vinculados a clientes, órdenes vinculadas a equipos.
- Código único de orden e historial de cambios de estado con autor y fecha.
- Transiciones consecutivas y bloqueo de cambios en órdenes entregadas o canceladas.
- Cálculo de total: servicio + cantidad × precio histórico de cada repuesto.
- Pagos positivos sin sobrepasar el saldo. Entrega únicamente con saldo liquidado.
- Órdenes, diagnósticos y pagos se conservan; no se eliminan desde el sistema.
- Eliminación de clientes, equipos y repuestos únicamente si no tienen relaciones que deban conservarse.
- Contraseñas con scrypt y sal aleatoria. Cookie HttpOnly, SameSite=Lax y Secure en producción. Sesiones de 8 horas guardadas por hash.
- Bloqueo temporal tras cinco intentos fallidos por cuenta, comprobación de origen, validación en servidor y consultas parametrizadas.
- Revocación de sesiones al cambiar permisos o desactivar cuentas.
- Actualización inmediata después de guardar y consulta automática cada 30 segundos.

## Arquitectura

- `src/app`: rutas, páginas protegidas, metadatos y CSS responsivo.
- `src/components`: interfaz, formularios, detalles y Provider de Context API.
- `src/lib/service.js`: validaciones, permisos, reglas y transacciones.
- `src/lib/db.js`: esquema y acceso a SQLite.
- `src/lib/auth.js`: contraseñas y sesiones.
- `src/lib/domain.js`: estados y cálculo de importes compartidos.
- `src/app/api/[...path]/route.js`: API REST.

## API

POST `/api/auth/register`, `/api/auth/login`, `/api/auth/logout`.
GET `/api/auth/me`, `/api/data` (snapshot filtrado por permisos).
POST `/api/clients`, `/api/equipment`, `/api/orders`, `/api/parts`, `/api/diagnostics`, `/api/lines`, `/api/payments`.
PATCH `/api/clients/:id`, `/api/equipment/:id`, `/api/orders/:id`, `/api/parts/:id`, `/api/users/:id`.
DELETE `/api/clients/:id`, `/api/equipment/:id`, `/api/parts/:id` (con restricciones).

Errores JSON: `{ "error": "mensaje" }`, con códigos 400, 401, 403, 404, 409, 413, 422 y 429 según el caso.

## Verificación de integración

Usar una base VACÍA y separada. El script crea usuarios y datos de prueba, y no debe ejecutarse contra datos del taller.

PowerShell, primera terminal:

```powershell
$env:FIXTRACK_DB = Join-Path (Get-Location) 'data\pruebas-nuevas.sqlite'
npm run dev -- --port 3100
```

Segunda terminal:

```sh
node tests/integration.mjs
```

Comprueba registro, aprobación, roles, acceso a órdenes asignadas, diagnóstico, cantidades, sobrepagos, entrega, integridad referencial, historial y revocación de sesión. Para repetir, usar otra base vacía.

## Alcance y pendientes reales

Esta entrega implementa la versión WEB LOCAL. No incluye React Native, mockups Figma, documento APA ni video de la etapa móvil.

SQLite necesita un disco persistente. Esta versión no está preparada para Vercel serverless: debe migrarse el acceso a datos y las sesiones a una base externa antes de desplegar allí. El servidor rechaza explícitamente ese entorno para evitar pérdida de información. No se ha desplegado ni publicado en GitHub. Las ramas y commits de cada integrante deben reflejar el trabajo real de cada persona.

No incluye cobros en línea, facturación electrónica, envío de correos, recuperación de contraseña por correo, adjuntos, control de existencias ni conciliación/reversión de pagos. Los repuestos son un catálogo y su uso por orden, no un inventario de almacén. La pantalla Usuarios permite restablecimiento administrativo de contraseña.

El reporte filtra órdenes por FECHA DE APERTURA; sus pagos corresponden a esas órdenes, no a un libro de caja filtrado por fecha de cobro.

Pruebas de reglas de negocio sin servidor: npm test (base temporal aislada). Esta verificación también comprueba persistencia al reabrir SQLite.


## Resultado de verificación de esta entrega

- npm run build: aprobado (Next.js 16.4.2, webpack).
- npm run lint: aprobado, sin errores ni advertencias.
- npm test: aprobado; base de prueba temporal e independiente.
- Prueba HTTP: no completada; el entorno de trabajo rechazó la conexión a localhost con EACCES. El script tests/integration.mjs queda disponible para ejecutarlo localmente.
- Revisión visual interactiva: pendiente; el control de VS Code no pudo conectarse.
- Publicación en Vercel y aplicación React Native: pendientes, no forman parte de lo construido en esta copia.
