# FixTrack SV

Sistema web para gestionar un taller de reparación de computadoras. Implementación de la etapa web de DPS: React, Next.js, Context API, API REST y MariaDB.

## Ejecutar

Requisito: Node.js 24 LTS. Desde esta carpeta:

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

La aplicación mantiene los datos en MariaDB. El script [database/fixtrack-mariadb.sql](database/fixtrack-mariadb.sql) crea la base y todas sus tablas. Ejecutarlo desde MySQL Workbench antes de arrancar la aplicación. No subir credenciales a GitHub.

Configurar la conexión con variables de entorno. Para la conexión mostrada en MySQL Workbench:

```powershell
$env:MARIADB_HOST = '127.0.0.1'
$env:MARIADB_PORT = '3307'
$env:MARIADB_USER = 'root'
$env:MARIADB_PASSWORD = 'TU_CONTRASEÑA'
$env:MARIADB_DATABASE = 'fixtrack'
npm run dev -- --hostname 0.0.0.0
```

Si el usuario `root` no tiene contraseña, dejar `MARIADB_PASSWORD` vacío. Para no repetirlas en cada terminal, usar un archivo `.env.local` privado. La API crea las tablas automáticamente si la base `fixtrack` ya existe, pero se recomienda ejecutar primero el script completo.

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
- `src/lib/db.js`: esquema y acceso al pool de MariaDB.
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
$env:MARIADB_DATABASE = 'fixtrack_test'
npm run dev -- --port 3100
```

Segunda terminal:

```sh
node tests/integration.mjs
```

Comprueba registro, aprobación, roles, acceso a órdenes asignadas, diagnóstico, cantidades, sobrepagos, entrega, integridad referencial, historial y revocación de sesión. Para repetir, usar otra base vacía.

## Alcance y pendientes reales

Esta entrega implementa la versión WEB LOCAL. No incluye React Native, mockups Figma, documento APA ni video de la etapa móvil.

MariaDB necesita un servidor accesible y copias de seguridad. Para Vercel, la instancia MariaDB debe permanecer fuera de Vercel y permitir conexiones TLS desde la API. No se ha desplegado ni publicado en GitHub. Las ramas y commits de cada integrante deben reflejar el trabajo real de cada persona.

No incluye cobros en línea, facturación electrónica, envío de correos, recuperación de contraseña por correo, adjuntos, control de existencias ni conciliación/reversión de pagos. Los repuestos son un catálogo y su uso por orden, no un inventario de almacén. La pantalla Usuarios permite restablecimiento administrativo de contraseña.

El reporte filtra órdenes por FECHA DE APERTURA; sus pagos corresponden a esas órdenes, no a un libro de caja filtrado por fecha de cobro.

Pruebas de reglas de negocio sin servidor: npm test (base MariaDB de prueba aislada). Esta verificación también comprueba persistencia después de cerrar y volver a consultar la conexión.


## Resultado de verificación de esta entrega

- npm run build: aprobado (Next.js 16.4.2, webpack).
- npm run lint: aprobado, sin errores ni advertencias.
- npm test: aprobado; base de prueba temporal e independiente.
- Prueba HTTP: no completada; el entorno de trabajo rechazó la conexión a localhost con EACCES. El script tests/integration.mjs queda disponible para ejecutarlo localmente.
- Revisión visual interactiva: pendiente; el control de VS Code no pudo conectarse.
- Publicación en Vercel: pendiente. App React Native añadida en FixTrack-Mobile; ver allí el estado de las pruebas en dispositivo.

## Actualización para la app móvil

La carpeta hermana FixTrack-Mobile contiene la aplicación React Native. Este backend ahora acepta Authorization: Bearer y emite token al recibir X-FixTrack-Client: mobile en login/registro. Los tokens se almacenan por hash, expiran en 8 horas y se revocan al salir o cambiar permisos. Las cookies del acceso web siguen funcionando.

Iniciar para acceso desde la red local: npm run dev -- --hostname 0.0.0.0. La guía de instalación y los límites de la verificación móvil están en FixTrack-Mobile/README.md.

FIXTRACK_BUILD_DIR permite una carpeta de compilación alternativa cuando el entorno bloquea un caché anterior. Si se usa, proporcionar la misma variable al compilar y al iniciar en producción.
