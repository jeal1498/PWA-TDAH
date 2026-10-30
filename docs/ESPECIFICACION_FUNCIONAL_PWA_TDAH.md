# Especificación funcional — PWA «Un paso a la vez»

**Estado:** propuesta funcional lista para implementación y validación  
**Fecha:** 30 de octubre de 2026  
**Producto:** PWA para adultos hispanohablantes con TDAH o dificultades de funciones ejecutivas  
**Audiencia:** Claude Code, OpenAI Codex y equipo de desarrollo

---

## 0. Instrucciones obligatorias para el agente de programación

Antes de modificar código:

1. Lee este documento completo.
2. Inspecciona el repositorio: stack, estructura, rutas, componentes, almacenamiento, service worker, manifest, pruebas y estado real de cada función.
3. Clasifica cada requisito P0 como existente, parcial o faltante. No reconstruyas funciones que ya estén correctamente implementadas.
4. Presenta un plan por fases, archivos que modificarás y riesgos de migración.
5. Respeta arquitectura, convenciones y dependencias actuales. No cambies de framework ni agregues dependencias de producción sin justificarlo.
6. Implementa en incrementos pequeños y ejecuta las pruebas disponibles y el build.
7. No inventes resultados de pruebas: informa comandos ejecutados y resultados reales.
8. No implementes pagos, cuentas, sincronización en nube, comunidad, videollamadas ni IA remota en este ciclo.
9. Nunca envíes a analítica el texto de tareas, subtareas, notas ni dictados.
10. Si una decisión técnica no está especificada, elige la solución más simple compatible con el código y documenta la decisión.

Esta especificación define el comportamiento deseado; no afirma que el repositorio ya tenga una arquitectura o funciones concretas. La auditoría es el primer paso obligatorio.

## 1. Visión del producto

### Problema
Una persona puede acumular pendientes, sentirse abrumada, no saber por dónde empezar, perder la noción del tiempo o abandonar una actividad después de una interrupción. Las herramientas tradicionales pueden añadir carga de planificación y mantenimiento.

### Propuesta de valor
> Te ayudamos a pasar de tener demasiadas cosas en la cabeza a realizar una acción concreta, incluso cuando te cuesta empezar.

### Posicionamiento
Asistente de ejecución de tareas para adultos hispanohablantes. No es un calendario completo, agenda corporativa, curso, videojuego, herramienta de diagnóstico ni tratamiento del TDAH.

### Principios de diseño
1. Acción antes que organización.
2. Una cosa a la vez: priorizar una siguiente acción clara sobre listas largas.
3. Baja fricción: pocos campos y valores predeterminados.
4. Control del usuario: toda sugerencia puede editarse, omitirse o rechazarse.
5. Retomar sin culpa: no penalizar pausas, interrupciones ni días sin uso.
6. Tiempo visible: duración y temporizador comprensibles.
7. Privacidad por defecto: el contenido personal permanece local.
8. Español natural, claro, cercano, no infantilizante y sin juicios.

## 2. Usuarios y escenarios

### Usuario primario
Adulto hispanohablante con TDAH diagnosticado o dificultades de funciones ejecutivas que acumula pendientes, se bloquea ante tareas grandes, se distrae o necesita ayuda para retomar. No se requiere diagnóstico para usar el producto.

### Escenarios prioritarios
- «Tengo muchas cosas pendientes y no sé por dónde empezar».
- «Sé qué tengo que hacer, pero la tarea parece demasiado grande».
- «Me distraje y ya no recuerdo dónde iba».
- «Solo tengo cinco minutos y quiero avanzar».
- «No terminé ayer; quiero retomarlo sin sentir que fracasé».

## 3. Alcance y prioridades

### P0 — Núcleo obligatorio del MVP
- Captura rápida de una tarea.
- Brain dump: capturar varios pendientes sin clasificarlos.
- Lista sencilla de tareas pendientes.
- Descomposición en pasos editables.
- Ajuste de granularidad de los pasos.
- Presentación de una única siguiente acción.
- Temporizador visual.
- Pausar, continuar, finalizar y abandonar sesión sin perder el estado de la tarea.
- Completar pasos y tareas.
- Historial básico.
- Recuperación de tareas incompletas.
- Persistencia local.
- Analítica de eventos sin contenido personal, solo si existe infraestructura compatible y consentimiento claro.

### P1 — Después de validar P0
- Vista «Hoy» ligera.
- Rutinas reutilizables.
- Recordatorios opcionales.
- Dictado por voz, sujeto a permisos y compatibilidad del navegador.
- Estimación de tiempo editable.
- Resumen contextual para retomar.
- Seguimiento agregado de patrones de uso.

### P2 — Fuera del primer ciclo
- IA generativa remota y personalización avanzada.
- Body doubling con otras personas.
- Comunidad, chat o perfiles sociales.
- Videollamadas.
- Gamificación compleja, monedas, niveles o rankings.
- Integraciones de calendario y terceros.
- Suscripciones, pagos y paywall.
- Cuentas y sincronización multi-dispositivo.

No anticipar P1/P2 si retrasa o complica el núcleo.

## 4. Arquitectura de información y pantallas

La navegación debe ser corta y consistente. Áreas mínimas:
1. Inicio: captura, brain dump y siguiente acción.
2. Pendientes: tareas activas e incompletas.
3. Enfoque: temporizador asociado a una acción.
4. Historial: tareas y acciones terminadas.

En móvil, priorizar navegación inferior o el patrón ya existente. No crear navegación duplicada.

### Pantalla A — Inicio

**Objetivo:** capturar algo o empezar una acción sin configurar nada.

Elementos:
- Encabezado: «¿Qué tienes en mente?».
- Campo con placeholder «Escribe algo que necesitas hacer…».
- Acción principal «Agregar».
- Acceso secundario «Vaciar mi cabeza».
- Bloque «Tu siguiente paso» si existe una acción recomendada.
- Acceso a pendientes e historial.

Reglas:
- Campo visible sin desplazamiento inicial en móviles comunes.
- Enter agrega cuando corresponda; en móvil debe existir botón explícito.
- Al agregar, limpiar campo y confirmar brevemente sin modal.
- No exigir fecha, prioridad, categoría, proyecto ni duración.
- Sin tareas: mostrar estado vacío útil, un ejemplo y una invitación a capturar.
- No mostrar métricas, rachas ni gráficos en Inicio P0.

### Pantalla B — Brain dump

**Objetivo:** descargar pendientes sin obligar a clasificarlos.

Elementos: título «Saca todo de tu cabeza», editor multilínea, una tarea por línea, botón «Guardar pendientes» y acción «Cancelar».

Reglas:
- Cada línea no vacía se convierte en una tarea independiente.
- Recortar espacios exteriores e ignorar líneas vacías.
- Conservar el texto de cada línea tras recorte exterior.
- No interpretar ni enviar contenido a servicios externos.
- Confirmar cuántas tareas se añadieron.
- No exigir configuración posterior.

### Pantalla C — Pendientes

**Objetivo:** mostrar y administrar tareas activas sin abrumar.

Elementos:
- Lista de tareas pendientes.
- Cada elemento muestra título, estado y, si existe, pasos completados.
- Acciones: abrir, editar título, dividir en pasos, archivar o eliminar según patrón actual.
- Filtro mínimo opcional: «Todas» y «En progreso».

Reglas:
- Orden: tarea en progreso primero; después orden manual o más recientes, según lo que ya soporte el proyecto.
- P0 no requiere fechas límite. No mostrar alertas rojas ni mensajes de fracaso.
- No ocultar tareas incompletas automáticamente.
- Confirmar antes de eliminar permanentemente una tarea con pasos o sesiones.
- Completar mueve la tarea al historial; no la borra.

### Pantalla D — Detalle y descomposición

**Objetivo:** convertir una tarea grande en pasos pequeños y ejecutables.

Elementos:
- Título editable.
- Control de granularidad:
  - «Pocos pasos»: 3–4 pasos amplios.
  - «Equilibrado»: 4–6 pasos concretos; valor predeterminado.
  - «Muy detallado»: 6–10 pasos pequeños.
- Lista editable y reordenable.
- Acción «Agregar paso».
- Acción para generar o volver a generar sugerencias.
- Bloque destacado «Siguiente acción».
- Botón «Empezar 5 min».
- Opción «Empezar sin dividir».

Reglas:
- La descomposición puede usar reglas locales existentes; no asumir IA real.
- Si no existe motor, implementar sugerencias deterministas sencillas y etiquetarlas como sugerencias editables. No presentarlas como IA.
- Evitar pasos vacíos, duplicados idénticos e instrucciones vagas como «hacer la tarea».
- Cada paso debe comenzar preferentemente con un verbo y describir una acción observable.
- Permitir editar, completar, eliminar y reordenar pasos.
- Si falla la generación, permitir crear pasos manualmente.
- Siguiente acción = primer paso incompleto según el orden actual, salvo selección explícita.
- Completar un paso no completa la tarea si quedan pasos pendientes.
- Si todos se completan, marcar la tarea como completada y mostrar confirmación discreta.

### Pantalla E — Enfoque / temporizador

**Objetivo:** facilitar el inicio y sostener un bloque corto de acción.

Duraciones P0: 2, 5, 10 y 15 minutos. Predeterminado: 5 minutos.

Elementos:
- Acción actual.
- Temporizador grande y visual.
- Indicador circular o barra de progreso.
- Botones «Pausar» / «Continuar» y «Terminar».
- Acceso discreto «Cambiar duración».
- Al finalizar: «Terminaste este bloque. ¿Qué quieres hacer ahora?».

Reglas:
- Calcular tiempo restante con timestamps, no depender solo de ticks; tolerar cambios de pestaña y suspensión del dispositivo.
- Al recargar, restaurar sesión activa o pausada desde almacenamiento local.
- Pausar conserva tiempo restante; continuar reanuda desde ahí.
- «Terminar» antes del final pregunta si registrar el bloque como terminado o descartarlo, cuando esa distinción afecte al historial.
- Al finalizar, emitir señal visual y accesible; sonido opcional y apagado por defecto.
- No bloquear al usuario ni impedir cerrar la pantalla.
- Una sesión de temporizador no equivale a una tarea completada.
- Si el navegador no permite notificaciones, el temporizador sigue funcionando en la interfaz.

### Pantalla F — Historial

**Objetivo:** reconocer avances y permitir retomar contexto.

Elementos:
- Lista cronológica de tareas completadas.
- Fecha de finalización.
- Resumen opcional de pasos completados.

Reglas:
- Mostrar primero lo más reciente.
- Sin puntuaciones, comparaciones ni rachas.
- No inferir calidad, productividad ni rendimiento clínico.
- Si no hay historial, explicar que aparecerá al completar una tarea.

### Recuperación / reanudación

Al volver a abrir:
- Si hay sesión pausada, mostrar «Tienes una sesión pausada» con «Continuar» y «Dejar para después».
- Si hay tarea en progreso, mostrar su siguiente paso.
- No iniciar automáticamente sonido, notificación o temporizador.
- Si no hay actividad previa, mostrar Inicio normalmente.

## 5. Reglas de negocio

### Entidades mínimas

**Task**
- id: identificador único.
- title: texto requerido.
- status: inbox | active | completed | archived.
- createdAt, updatedAt.
- completedAt: nullable.
- sortOrder: opcional.
- source: quick_capture | brain_dump | routine (routine solo P1).

**Step**
- id.
- taskId.
- title.
- status: pending | completed.
- sortOrder.
- createdAt, completedAt.

**FocusSession**
- id.
- taskId y stepId: nullable si no está asociada.
- durationSeconds.
- remainingSeconds.
- status: running | paused | completed | abandoned.
- startedAt, pausedAt, endedAt.
- No almacenar texto libre adicional.

Adaptar nombres a los modelos existentes. No migrar innecesariamente si ya hay esquema equivalente.

### Persistencia
- P0 funciona sin cuenta y sin conexión para operaciones locales.
- Usar el mecanismo existente. Preferir IndexedDB si volumen/relaciones lo justifican; no cambiar almacenamiento sin revisar el código y la migración.
- Si existe localStorage, preservar datos mediante migración segura.
- Versionar esquema.
- Manejar errores de lectura/escritura con mensaje recuperable.
- No borrar datos al actualizar la PWA.
- No guardar secretos ni tokens en almacenamiento local.

### Ciclo de vida de tareas
- Capturada → inbox.
- Al abrir o trabajar → active.
- Al completar todos los pasos, o completar explícitamente una tarea sin pasos → completed.
- Archivar/eliminar es acción explícita.
- Tareas completadas se conservan en historial.
- Incompletas permanecen disponibles tras reabrir.

### Selección de siguiente acción
1. Paso incompleto seleccionado explícitamente.
2. Primer paso incompleto de tarea activa.
3. Primera tarea activa sin pasos.
4. Si no hay tareas activas, invitar a capturar una.

No inferir urgencia o importancia sin datos del usuario. No reordenar silenciosamente mediante puntuaciones opacas.

### Tono
Usar: «Puedes retomarlo cuando quieras», «Vamos con un paso pequeño», «Tu progreso sigue aquí», «¿Qué te ayudaría a empezar?».
Evitar: «Fallaste», «Perdiste tu racha», «Vas atrasado», «Deberías haber terminado». No infantilizar ni presentar el TDAH como falta de voluntad.

## 6. Accesibilidad y diseño visual

- Mobile-first y responsive.
- Objetivos táctiles de al menos 44 × 44 px cuando sea posible.
- Contraste suficiente; no depender solo del color.
- Etiquetas accesibles para botones e iconos.
- Navegación por teclado y foco visible.
- Temporizador anunciado de forma no intrusiva; no anunciar cada segundo a lectores de pantalla.
- Respetar prefers-reduced-motion.
- Tipografía legible y jerarquía clara.
- Evitar pantallas densas, animaciones constantes y exceso de badges.
- No usar emojis como único indicador de acción o estado.

## 7. Privacidad, seguridad y analítica

### Privacidad
- Texto de tareas, pasos y dictados es contenido personal.
- No enviar esos textos a analítica, logs, telemetría ni servicios externos.
- No integrar IA remota en P0.
- Explicar claramente si una futura función requiere transmitir contenido a un proveedor externo.
- No solicitar diagnóstico ni datos médicos para usar la app.
- No hacer claims de diagnóstico, tratamiento o eficacia clínica.

### Analítica mínima opcional
Solo con aviso claro y consentimiento cuando corresponda. Eventos sin payload de contenido:
- task_captured
- brain_dump_saved (solo cantidad de elementos)
- breakdown_requested
- step_selected
- timer_started (duración, nunca texto)
- timer_paused
- timer_resumed
- timer_completed
- task_completed
- task_resumed

Propiedades permitidas: timestamp, identificador seudónimo aleatorio, versión de app, tipo de evento, duración y conteos agregados. Nunca títulos, pasos o notas.

Si no hay backend/analítica configurados, no inventar uno. Dejar interfaz desacoplada o documentar el requisito pendiente.

## 8. Métricas de validación

Piloto inicial de 14 días con 20–30 participantes. Son umbrales internos, no benchmarks universales.

| Métrica | Definición | Umbral |
|---|---|---:|
| Activación | Captura tarea y llega a una siguiente acción | ≥60% |
| Inicio de acción | Inicia temporizador o marca primer paso | ≥50% |
| Retención D7 | Vuelve dentro del día 7 según ventana definida | ≥30% |
| Retención D14 | Vuelve dentro del día 14 | ≥20% |
| Utilidad percibida | Declara que ayudó a empezar/retomar | ≥60% |
| Interés de pago | Intención verificable o acepta prueba de precio | ≥10% |

No optimizar para tiempo en pantalla. La métrica principal es acciones iniciadas y retomadas, no sesiones largas.

## 9. Criterios de aceptación verificables

### P0-01 Captura rápida
- Desde Inicio, título no vacío + Agregar crea una tarea.
- Campo se limpia tras guardar.
- Título vacío o espacios no crea tarea y muestra validación accesible.
- La tarea sobrevive a recargar.

### P0-02 Brain dump
- Cinco líneas no vacías y dos vacías crean exactamente cinco tareas.
- No se crean tareas vacías.
- Se confirma cantidad creada.
- Contenido no se transmite fuera del dispositivo.

### P0-03 Descomposición
- Una tarea puede dividirse en pasos.
- Cada paso puede editarse, completarse, eliminarse y reordenarse.
- Granularidad modifica número/detalle de sugerencias cuando el motor lo soporte.
- Si falla la generación, se pueden crear pasos manualmente.
- Se puede iniciar sin dividir.

### P0-04 Siguiente acción
- Si hay paso seleccionado e incompleto, se muestra ese.
- En otro caso se muestra el primer paso incompleto.
- Sin pasos, ofrecer la tarea como acción o dividirla.
- Nunca mostrar dos acciones principales simultáneas.

### P0-05 Temporizador
- Permite 2, 5, 10 o 15 minutos.
- Pausar/continuar conserva tiempo restante.
- Reload recupera sesión y tiempo coherentes.
- Al finalizar, la sesión queda completada.
- El temporizador no completa automáticamente la tarea.

### P0-06 Retomar
- Tarea incompleta sigue disponible tras cerrar y abrir.
- Sesión pausada ofrece continuar o dejar para después.
- No se reinicia progreso.
- No hay lenguaje de culpa ni penalización.

### P0-07 Historial
- Tarea completada aparece con fecha.
- Tareas activas no desaparecen.
- Historial sobrevive a reload y actualización normal.

### P0-08 Accesibilidad
- Acciones principales ejecutables con teclado.
- Botones con nombres accesibles.
- Estados no dependen solo del color.
- Temporizador no anuncia cada segundo.

### P0-09 Privacidad
- Inspección de eventos/logs confirma que no se transmiten títulos, pasos ni dictados.
- No se añade proveedor externo de IA o analítica sin documentar y aprobar flujo de datos.

### P0-10 PWA
- Manifest y service worker existentes siguen funcionando.
- App instalable y abrible desde dispositivo.
- Flujos P0 no dependen de red una vez cargada.
- Actualización no elimina datos locales.

## 10. Casos límite de prueba

- Doble toque en Agregar no crea duplicados accidentales.
- Texto largo no rompe el layout.
- Brain dump con líneas vacías o espacios.
- Eliminar tarea con pasos o sesiones.
- Completar pasos fuera de orden.
- Pausar, cambiar pestaña, bloquear teléfono y volver.
- Suspensión de PWA durante temporizador.
- Cambio del reloj del sistema durante sesión.
- Almacenamiento lleno o error de escritura.
- Actualización con sesión pausada.
- Permisos de notificaciones o micrófono denegados.
- Navegador sin soporte de API opcional.
- Sin tareas o historial.
- Temporizador sin tarea asociada.

## 11. Plan de implementación

### Fase 0 — Auditoría
- Identificar stack, estructura y punto de entrada.
- Inventariar funciones existentes.
- Revisar almacenamiento y compatibilidad de datos.
- Revisar pruebas, lint y build.
- Entregar matriz existente/parcial/faltante para P0.

Salida: plan por archivo, riesgos de migración y pruebas.

### Fase 1 — Robustecer núcleo
- Captura rápida y persistencia.
- Brain dump.
- Estados y ciclo de vida de tareas.
- Historial.
- Migración de datos si aplica.

### Fase 2 — Ejecución
- Descomposición editable y granularidad.
- Selección de siguiente acción.
- Flujo sin pasos.
- Manejo de fallos de sugerencias.

### Fase 3 — Temporizador y reanudación
- Máquina de estados de sesión.
- Persistencia y cálculo con timestamps.
- Recuperación tras recarga/suspensión.
- Estados accesibles.

### Fase 4 — Calidad
- Pruebas unitarias e integración.
- Pruebas manuales móvil/escritorio.
- Verificar PWA offline y actualización.
- Verificar privacidad.
- Build y lint.

No comenzar P1 hasta que P0 esté estable y probado.

## 12. Estrategia mínima de pruebas

Cubrir:
- creación, edición y completado de tareas;
- parseo de brain dump;
- generación y edición de pasos;
- selección de siguiente acción;
- transiciones de sesión;
- cálculo de tiempo restante con timestamps;
- persistencia y recuperación tras reload;
- migración de almacenamiento si aplica;
- accesibilidad básica.

Si no existe framework de pruebas, inspeccionar dependencias y proponer opción ligera. No introducir framework grande sin justificación.

## 13. Fuera de alcance explícito

No implementar en este ciclo:
- diagnóstico, screening o recomendaciones clínicas;
- promesas de reducción de síntomas;
- terapia o asesoramiento médico;
- IA que decida prioridades sin control del usuario;
- calendario completo o planificación horaria obligatoria;
- rachas que se pierden;
- rankings o comparación social;
- publicidad;
- pagos o suscripciones;
- sincronización multi-dispositivo;
- cuentas o login;
- comunidad o videollamadas.

## 14. Definición de terminado

Una fase P0 solo está terminada cuando:
- el comportamiento coincide con esta especificación;
- los datos existentes se conservan;
- casos límite relevantes están cubiertos;
- pruebas disponibles pasan;
- lint/build pasan, si existen;
- no hay errores críticos en consola en flujos principales;
- se verificó funcionamiento móvil;
- no se filtra contenido de tareas a analítica;
- se entrega resumen de archivos modificados, decisiones, pruebas y pendientes.

## 15. Prompt de ejecución para Claude Code o Codex

Lee el archivo docs/ESPECIFICACION_FUNCIONAL_PWA_TDAH.md completo y úsalo como fuente de verdad funcional. Primero audita el repositorio sin modificar archivos. Mapea cada requisito P0 como existente, parcial o faltante e identifica stack, almacenamiento, service worker, manifest, scripts y pruebas. Después presenta un plan por fases con archivos concretos y riesgos de migración. Cuando el plan esté claro, implementa únicamente P0 en incrementos pequeños, reutilizando lo existente y sin añadir dependencias innecesarias. No implementes P1/P2, pagos, cuentas, sincronización, comunidad ni IA remota. Conserva los datos locales y no envíes contenido de tareas a analítica. Ejecuta pruebas, lint y build disponibles; informa resultados reales y cualquier requisito no completado. No declares terminado algo que no hayas verificado.

---

**Principio rector:** cada pantalla debe ayudar al usuario a dar el siguiente paso. Si una función añade más decisiones, configuración o mantenimiento del que elimina, no pertenece al núcleo del producto.
