# Arranca

PWA para adultos con TDAH: **del bloqueo a la acción**. Psic. Karen Trujillo.

- **Hoy:** saca todo de tu cabeza, recibe una sola acción sugerida, avanza en pasos mini con temporizador y retoma sin perder tu avance.
- **Aprender:** lecciones cortas tipo juego (Unidad 1: Entiende tu TDAH).
- **Progreso:** racha flexible, tareas iniciadas/terminadas y si la app te ayudó.

Todo se guarda en el dispositivo (localStorage). Sin conexión funciona gracias al service worker.

> Arranca ofrece psicoeducación y estrategias. No sustituye diagnóstico ni tratamiento profesional.

## IA (Claude Haiku 5.5)
La app pide ayuda a `api/ai.js`, que guarda la clave de Anthropic en el servidor. Las instrucciones para la IA están en `prompts.js`.
Si el servidor no está disponible, la app sigue funcionando con pasos genéricos.

### Publicar en Vercel
1. Entra a vercel.com con tu cuenta de GitHub e importa este repo (sin configuración extra).
2. En **Settings → Environment Variables** agrega `ANTHROPIC_API_KEY` con tu clave de console.anthropic.com.
3. Vuelve a desplegar. La app queda en `https://<tu-proyecto>.vercel.app`.

Límite básico: 60 peticiones por hora por persona.

## Pendiente
- Empaquetar como APK para Play Store con Bubblewrap (TWA).
- Cuentas de usuario y pagos (Premium).
