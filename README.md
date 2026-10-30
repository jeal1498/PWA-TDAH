# Arranca

PWA para adultos con TDAH: **del bloqueo a la acción**. Psic. Karen Trujillo.

- **Hoy:** saca todo de tu cabeza, recibe una sola acción sugerida, avanza en pasos mini con temporizador y retoma sin perder tu avance.
- **Aprender:** lecciones cortas tipo juego (Unidad 1: Entiende tu TDAH).
- **Progreso:** racha flexible, tareas iniciadas/terminadas y si la app te ayudó.

Todo se guarda en el dispositivo (localStorage). Sin conexión funciona gracias al service worker.

> Arranca ofrece psicoeducación y estrategias. No sustituye diagnóstico ni tratamiento profesional.

## Privacidad y IA
El texto de tus tareas no sale del dispositivo. La IA remota está **apagada** (`REMOTE_AI=false` en `index.html`); los pasos y el orden usan reglas locales. `api/ai.js` y `prompts.js` se conservan sin uso para una futura opción con consentimiento explícito. La app solo carga las tipografías de Google Fonts (sin datos de tareas).

## Datos y pruebas
- Esquema v5 en `localStorage` (`arranca-v5`). Al abrir, migra `arranca-v4` y la deja intacta como respaldo. Si un dato está corrupto se guarda copia en `arranca-v5-corrupto`.
- Lógica pura en `core.js`. Pruebas: `npm test` (`node:test`, sin dependencias).
- Aprender, XP, racha y Premium siguen en el código pero ocultos de la navegación principal.

### Publicar en Vercel
1. Entra a vercel.com con tu cuenta de GitHub e importa este repo (sin configuración extra).
2. En **Settings → Environment Variables** agrega `ANTHROPIC_API_KEY` con tu clave de console.anthropic.com.
3. Vuelve a desplegar. La app queda en `https://<tu-proyecto>.vercel.app`.

Límite básico: 60 peticiones por hora por persona.

## Pendiente
- Empaquetar como APK para Play Store con Bubblewrap (TWA).
- Cuentas de usuario y pagos (Premium).
