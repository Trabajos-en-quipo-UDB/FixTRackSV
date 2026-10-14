# FixTrack SV — aplicación móvil

Versión nativa para Android/iOS creada con React Native y Expo SDK 57. Comparte usuarios y registros con el backend Next.js incluido en la carpeta `FixTrack-SV`. No usa una WebView ni simula una sesión con datos locales.

## Qué incluye

- Registro y login con validaciones y confirmación de contraseña.
- La primera cuenta es administradora; las siguientes requieren activación.
- Token Bearer de 8 horas, almacenado con Expo SecureStore; cierre y revocación en servidor.
- Inicio con resumen del taller, órdenes, búsqueda, filtros y detalle.
- Clientes y equipos: creación, consulta, edición e historial.
- Seguimiento de estados y asignación de técnico.
- Diagnóstico, trabajo realizado, repuestos utilizados y registro de pagos.
- Catálogo de repuestos y activación/roles de usuarios para administración.
- Navegación por pestañas y pila; botón Volver y retroceso de Android.
- Actualización tras guardar, actualización manual y consulta cada 30 segundos.
- Mensajes de carga, sesión vencida, errores del servidor y falta de conexión.

## Arranque en Windows + teléfono Android

Requisito común: Node.js 24 LTS y MariaDB accesible para el backend.

### 1. Iniciar el backend actualizado

Abrir una terminal en `FixTrack-SV`:

```powershell
$env:MARIADB_HOST = '127.0.0.1'
$env:MARIADB_PORT = '3307'
$env:MARIADB_USER = 'root'
$env:MARIADB_PASSWORD = 'TU_CONTRASEÑA'
$env:MARIADB_DATABASE = 'fixtrack'
npm ci
npm run dev -- --hostname 0.0.0.0
```

Antes de arrancar, ejecutar el script `FixTrack-SV/database/fixtrack-mariadb.sql` en MySQL Workbench para crear la base y sus tablas.

Abrir `http://localhost:3000` en la computadora. Se puede crear allí la primera cuenta administradora, o desde el móvil. No hay cuentas ni contraseñas predefinidas.

Este backend contiene la autenticación Bearer nueva. No usar la copia ZIP anterior sin actualizarla: aquella devuelve cookies para web y no entrega el token que requiere la app.

### 2. Instalar la app de desarrollo

En otra terminal, dentro de `FixTrack-Mobile`:

```sh
npm install
npx expo install --fix
npx expo-doctor
npx expo start
```

El comando `expo install --fix` alinea los paquetes con SDK 57. El proyecto usa Expo 57, React Native 0.86.3 y React 19.2.3 según las versiones compatibles del SDK. El `package-lock.json` móvil debe conservarse en Git después de instalar las dependencias.

Usar una versión de Expo Go compatible con SDK 57. Para Android se puede seleccionar la versión correspondiente en https://expo.dev/go. Si el Expo Go disponible no admite SDK 57, usar una compilación de desarrollo; no cambiar únicamente react-native.

Escanear el QR de Expo desde el teléfono. La app está destinada a Android/iOS, no al modo web de Expo.

### 3. Conectar la app con la computadora

La computadora y el teléfono deben usar la misma red. En Windows ejecutar `ipconfig` y tomar la dirección IPv4 del adaptador Wi-Fi activo. Ejemplo: `192.168.1.20`.

En la pantalla de acceso, campo **Servidor de FixTrack**, escribir:

```text
http://192.168.1.20:3000
```

Sustituir la IP por la real. No usar `localhost` en un teléfono: apuntaría al propio teléfono. No agregar `/api`, `/login` ni rutas.

Para un emulador Android estándar, la dirección del host suele ser `http://10.0.2.2:3000`. Para un dispositivo físico, usar la IP LAN real. El puerto 3000 debe ser accesible y la red no debe aislar clientes. No se modificó el firewall ni se abrieron puertos automáticamente.

El QR sirve para cargar la app desde Metro. La dirección de API es independiente; un túnel de Expo no convierte automáticamente el backend en un servidor público.

En un servidor público se exige HTTPS. HTTP solo se admite en direcciones privadas o locales para desarrollo. Para builds nativas, el sistema puede aplicar restricciones adicionales al tráfico HTTP; preferir una API HTTPS. Esta entrega no configura excepciones generales de seguridad de Android/iOS.

## iOS

El código usa componentes multiplataforma, pero no se ejecutó en iOS. Un iPhone físico necesita Expo Go compatible con el SDK o una compilación de desarrollo firmada. Si la versión de Expo Go de App Store no admite SDK 57, usar development build o actualizar el SDK. Un simulador iOS requiere macOS/Xcode.

## Organización

```text
App.js                   Navegación y control de sesión
src/context.js           Context API, sesión y sincronización
src/api.js               HTTP, tokens, timeout y errores
src/domain.mjs           Validaciones, estados y cálculos
src/ui.js                Componentes nativos y estilos
src/screens.js           Pantallas del taller
tests/                   Pruebas de dominio y contrato HTTP simulado
```

La navegación usa una pila de pantallas en estado React más pestañas y BackHandler. No incorpora React Navigation ni Expo Router. Para este avance permite navegar y volver; no implementa enlaces profundos ni gestos nativos de navegación.

La paleta sigue la web: verde oscuro #173B35, acento #C2F36D y fondo #F4F6F1. Se usan áreas seguras, controles táctiles de al menos 48 puntos en acciones principales, formularios desplazables, selectores con búsqueda y etiquetas accesibles.

## Roles y reglas

El backend es la autoridad. Ocultar botones no reemplaza sus comprobaciones de acceso.

- Administrador: configuración de usuarios, catálogo y operaciones generales.
- Recepcionista: clientes, equipos, órdenes, pagos y entrega.
- Técnico: consulta de sus órdenes, diagnósticos, costo del servicio y repuestos. No entrega, cancela ni registra pagos.

No se entregan equipos con saldo pendiente. Los estados avanzan consecutivamente. Los movimientos de órdenes cerradas no se editan. Las órdenes canceladas/entregadas se conservan en el historial. Esta versión móvil no incluye eliminación de catálogos ni exportación CSV; esas opciones están en la web.

## Verificación y límites

```sh
npm test
```

Las pruebas del móvil cubren registro, URL del servidor, estados según rol, cálculos, encabezados Bearer, sesión vencida y respuesta no JSON. Las pruebas HTTP usan fetch simulado: no prueban una conexión física.

El backend tiene `node tests/business.mjs` y `node tests/sessions.mjs`, con SQLite temporal, para reglas de negocio y sesiones reales.

Se verificó sintaxis JSX y resolución de imports locales. La instalación de Expo falló por ENOTFOUND al acceder a registry.npmjs.org. Por ello no se ejecutaron Metro, expo-doctor, emulador ni dispositivo; tampoco se generó APK/IPA. La compilación y lint del backend se verifican por separado.

El backend usa MariaDB. Para Vercel, la instancia MariaDB debe ser externa, persistente y accesible por TLS. No hay modo offline con escritura, notificaciones push, adjuntos, pagos en línea ni recuperación de contraseña por correo.

## Entrega académica

El código móvil es parte del avance. Queda pendiente ejecutar y grabar la demostración, publicar el repositorio con contribuciones reales del equipo, contrastar pantallas con los mockups Figma de Etapa 1 y elaborar el PDF de investigación en APA 7 solicitado por la guía. No se proporcionó el enlace al Figma del proyecto y no se afirma correspondencia verificada con sus mockups.

Ver `DEMO.md` para el recorrido de demostración y comprobación manual.

## Referencias técnicas consultadas

- Expo. (s. f.). Expo SDK reference, SDK 57. https://docs.expo.dev/versions/v57.0.0/
- Expo. (s. f.). Expo SecureStore, SDK 57. https://docs.expo.dev/versions/v57.0.0/sdk/securestore/
- Expo. (s. f.). react-native-safe-area-context, SDK 57. https://docs.expo.dev/versions/v57.0.0/sdk/safe-area-context/
- Expo. (s. f.). Start developing. https://docs.expo.dev/get-started/start-developing/
- Expo. (s. f.). Set up your environment. https://docs.expo.dev/get-started/set-up-your-environment/

Estas referencias documentan las decisiones técnicas; no constituyen por sí solas el informe de investigación solicitado por la asignatura.
