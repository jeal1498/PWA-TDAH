// Lógica pura de Arranca (sin DOM): la usan la app y las pruebas.
(function (root) {
  const SCHEMA = 5;

  const defaultState = () => ({
    schemaVersion: SCHEMA, done: [], xp: 0, days: {}, tasksDone: 0, tasksStarted: 0, stepsDone: 0,
    tasksToday: {}, inbox: [], activeId: null, helped: { yes: 0, no: 0 }, seeded: true,
    session: null, sessions: [], timerMin: null
  });

  // Recorta espacios exteriores; devuelve "" si no hay texto.
  const cleanTitle = s => String(s == null ? "" : s).trim();

  // Brain dump: una tarea por línea no vacía, conservando el texto tras el recorte exterior.
  const parseLines = text => String(text == null ? "" : text).split(/\r?\n/).map(cleanTitle).filter(Boolean);

  // Lleva datos de versiones anteriores (arranca-v4 o v5) al esquema actual sin perder nada.
  function migrate(raw) {
    const S = Object.assign(defaultState(), raw && typeof raw === "object" ? raw : {});
    S.done = (Array.isArray(S.done) ? S.done : []).map(x => typeof x === "number" ? "0-" + x : x);
    S.inbox = (Array.isArray(S.inbox) ? S.inbox : []).filter(x => x && typeof x === "object").map(it => {
      const o = Object.assign({}, it);
      if (!["open", "done", "archived"].includes(o.status)) o.status = "open";
      if (!Array.isArray(o.steps)) o.steps = null;
      if (!o.source) o.source = "quick_capture";
      if (o.steps) {
        const idx = o.idx || 0;
        o.steps = o.steps.map((st, i) => Object.assign({}, st, { id: st.id || i + 1, d: st.d != null ? !!st.d : (o.status === "done" || i < idx) }));
        o.stepSeq = Math.max(o.stepSeq || 0, ...o.steps.map(x => x.id));
        nextIdx(o);
      }
      if (o.status === "done" && !o.completedAt) o.completedAt = o.touched || o.added || Date.now();
      return o;
    });
    S.session = sanitizeSession(S.session);
    S.sessions = (Array.isArray(S.sessions) ? S.sessions : []).filter(x => x && typeof x === "object").slice(-200);
    if (!DURATIONS.includes(S.timerMin)) S.timerMin = null;
    S.schemaVersion = SCHEMA;
    return S;
  }

  // Pendientes: lo empezado primero (más reciente), después lo más reciente capturado.
  const sortPending = items => items.filter(x => x.status === "open").slice()
    .sort((a, b) => (b.started - a.started) || (b.started ? (b.touched || 0) - (a.touched || 0) : (b.added || 0) - (a.added || 0)));

  const sortHistory = items => items.filter(x => x.status === "done").slice()
    .sort((a, b) => (b.completedAt || 0) - (a.completedAt || 0));

  // ---------- Pasos ----------
  const GRAN = { few: [0, 3, 4, 7], balanced: [0, 1, 3, 4, 7, 8], detailed: [0, 1, 2, 3, 4, 5, 6, 7, 8] };
  const short = t => t.length > 40 ? t.slice(0, 39).trimEnd() + "…" : t;

  // Sugerencias deterministas (no es IA): pasos que empiezan con verbo y describen algo observable.
  function suggestSteps(title, gran) {
    const t = short(cleanTitle(title));
    if (!t) return [];
    const T = [
      ["Junta lo que necesitas para: " + t, 2], ["Despeja un lugar para trabajar en: " + t, 3],
      ["Anota cuál es la primera parte de: " + t, 2], ["Haz solo la parte más fácil de: " + t, 3],
      ["Avanza 5 minutos más con: " + t, 5], ["Anota qué falta de: " + t, 2],
      ["Haz la siguiente parte de: " + t, 5], ["Revisa lo que ya hiciste de: " + t, 3],
      ["Guarda lo que usaste y cierra: " + t, 2]
    ];
    return (GRAN[gran] || GRAN.balanced).map(i => ({ s: T[i][0], m: T[i][1] }));
  }

  const VAGUE = /^(hacer|haz|terminar|termina|completar|completa|trabajar|trabaja)( la tarea| todo| esto| eso)?\.?$/i;
  // Un paso nuevo no puede ser vacío, vago ni repetir otro paso de la misma tarea.
  function validateStep(steps, title, exceptId) {
    const t = cleanTitle(title);
    if (!t) return { ok: false, reason: "vacio" };
    if (VAGUE.test(t)) return { ok: false, reason: "vago" };
    if ((steps || []).some(x => x.id !== exceptId && x.s.toLowerCase() === t.toLowerCase())) return { ok: false, reason: "duplicado" };
    return { ok: true, title: t };
  }

  // Posición de la siguiente acción: el paso elegido (si sigue pendiente) o el primero pendiente.
  function nextIdx(it) {
    const st = it.steps || [];
    let i = -1;
    if (it.sel != null) i = st.findIndex(x => x.id === it.sel && !x.d);
    if (i < 0) { it.sel = null; i = st.findIndex(x => !x.d); if (i < 0) i = st.length; }
    it.idx = i;
    return i;
  }

  const addStep = (it, title, m) => {
    it.steps = it.steps || [];
    const st = { id: (it.stepSeq = (it.stepSeq || 0) + 1), s: title, m: m || 3, d: false };
    it.steps.push(st); nextIdx(it); return st;
  };
  const setSteps = (it, list) => { it.steps = []; it.sel = null; list.forEach(x => addStep(it, x.s, x.m)); return it.steps; };
  const renameStep = (it, id, title) => { const st = it.steps.find(x => x.id === id); if (st) st.s = title; return st; };
  const removeStep = (it, id) => { it.steps = it.steps.filter(x => x.id !== id); nextIdx(it); };
  const moveStep = (it, id, dir) => {
    const i = it.steps.findIndex(x => x.id === id), j = i + dir;
    if (i < 0 || j < 0 || j >= it.steps.length) return false;
    [it.steps[i], it.steps[j]] = [it.steps[j], it.steps[i]]; nextIdx(it); return true;
  };
  // Marca o desmarca un paso (en cualquier orden). Devuelve true si ya no queda ninguno pendiente.
  function toggleStep(it, id, now) {
    const st = it.steps.find(x => x.id === id);
    if (st) { st.d = !st.d; if (st.d) st.completedAt = now || Date.now(); else delete st.completedAt; }
    nextIdx(it);
    return it.steps.length > 0 && it.steps.every(x => x.d);
  }

  // Siguiente acción: paso elegido > primer paso pendiente de la tarea activa > tarea activa sin pasos > nada.
  function nextAction(items, activeId) {
    const act = sortPending(items.filter(x => x.started));
    const cur = act.find(x => x.id === activeId) || act[0];
    if (cur && cur.steps && cur.steps.length) {
      const i = nextIdx(cur);
      if (i < cur.steps.length) return { task: cur, step: cur.steps[i], index: i, explicit: cur.sel != null };
    }
    const bare = act.find(x => !x.steps || !x.steps.length);
    return bare ? { task: bare, step: null } : null;
  }

  // ---------- Sesiones de enfoque (se calculan con marcas de tiempo, no con ticks) ----------
  // Solo guardan ids y números: nunca texto de tareas.
  const DURATIONS = [2, 5, 10, 15];
  const isNum = x => typeof x === "number" && isFinite(x);

  function sanitizeSession(se) {
    if (!se || typeof se !== "object" || !["running", "paused", "completed"].includes(se.status)) return null;
    if (!isNum(se.durationSeconds) || se.durationSeconds <= 0) return null;
    const out = Object.assign({}, se);
    out.remainingSeconds = isNum(se.remainingSeconds) ? Math.min(Math.max(0, se.remainingSeconds), se.durationSeconds) : se.durationSeconds;
    if (out.status === "running" && !isNum(out.endsAt)) { out.status = "paused"; delete out.endsAt; }
    return out;
  }

  // Segundos restantes. Si el reloj retrocede nunca superan la duración; si avanza, la sesión termina.
  const remaining = (se, now) => se.status === "running"
    ? Math.max(0, Math.min(se.durationSeconds, Math.ceil((se.endsAt - now) / 1000)))
    : se.remainingSeconds;

  function startSession(o, now) {
    const dur = (DURATIONS.includes(o.minutes) ? o.minutes : 5) * 60;
    return { id: "s" + now.toString(36) + Math.floor(Math.random() * 1e4), taskId: o.taskId == null ? null : o.taskId, stepId: o.stepId == null ? null : o.stepId,
      durationSeconds: dur, remainingSeconds: dur, status: "running", startedAt: now, pausedAt: null, endedAt: null, endsAt: now + dur * 1000 };
  }
  // Si una sesión en marcha ya agotó su tiempo, la completa. Devuelve true si cambió.
  function syncSession(se, now) {
    if (se.status !== "running" || remaining(se, now) > 0) return false;
    se.status = "completed"; se.remainingSeconds = 0; se.endedAt = Math.min(now, se.endsAt); delete se.endsAt;
    return true;
  }
  function pauseSession(se, now) {
    if (syncSession(se, now) || se.status !== "running") return se;
    se.remainingSeconds = remaining(se, now); se.status = "paused"; se.pausedAt = now; delete se.endsAt;
    return se;
  }
  function resumeSession(se, now) {
    if (se.status !== "paused") return se;
    se.status = "running"; se.pausedAt = null; se.endsAt = now + se.remainingSeconds * 1000;
    syncSession(se, now);
    return se;
  }
  // counted=true: bloque registrado como terminado; false: descartado.
  function endSession(se, now, counted) {
    if (se.status === "running") se.remainingSeconds = remaining(se, now);
    se.status = counted ? "completed" : "abandoned"; se.endedAt = now; delete se.endsAt;
    return se;
  }
  function setDuration(se, minutes) {
    if (se.status !== "paused" || !DURATIONS.includes(minutes)) return se;
    se.durationSeconds = se.remainingSeconds = minutes * 60;
    return se;
  }

  const api = { DURATIONS, sanitizeSession, remaining, startSession, syncSession, pauseSession, resumeSession, endSession, setDuration, SCHEMA, defaultState, cleanTitle, parseLines, migrate, sortPending, sortHistory,
    suggestSteps, validateStep, nextIdx, addStep, setSteps, renameStep, removeStep, moveStep, toggleStep, nextAction };
  if (typeof module !== "undefined" && module.exports) module.exports = api;
  else root.ARRANCA_CORE = api;
})(typeof globalThis !== "undefined" ? globalThis : this);
