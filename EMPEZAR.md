# FixTrack SV móvil + backend actualizado

1. Abrir FixTrack-SV en VS Code. Ejecutar npm ci y luego npm run dev -- --hostname 0.0.0.0.
2. Abrir otra terminal en FixTrack-Mobile. Ejecutar npm install, npx expo install --fix, npx expo-doctor y npx expo start.
3. Usar Expo Go compatible con SDK 55 en Android y escanear el QR.
4. En Servidor de FixTrack escribir http://IP-DE-TU-PC:3000. Computadora y teléfono deben estar en la misma red. No usar localhost en un teléfono físico.
5. Crear la primera cuenta (administradora) o ingresar con una cuenta ya registrada en esa base. Las nuevas cuentas requieren activación.

Leer FixTrack-Mobile/README.md para las instrucciones completas, opciones de iOS y límites conocidos.

Incluye código fuente, no APK. La instalación de Expo no pudo completarse en el entorno de autoría por falta de acceso a npm; la ejecución en teléfono sigue pendiente. Pasaron siete pruebas móviles con Node, análisis de sintaxis/imports y pruebas de negocio/sesiones del backend. El backend compiló correctamente.

Usar el backend de ESTE ZIP: el anterior no tenía soporte Bearer móvil. No incluye bases de datos ni contraseñas.
