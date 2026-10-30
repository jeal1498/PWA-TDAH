// Lógica pura de Arranca (sin DOM): la usan la app y las pruebas.
(function (root) {
  const SCHEMA = 5;

  const defaultState = () => ({
    schemaVersion: SCHEMA, done: [], xp: 0, days: {}, tasksDone: 0, tasksStarted: 0, stepsDone: 0,
    tasksToday: {}, inbox: [], activeId: null, helped: { yes: 0, no: 0 }, seeded: true
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
      if (o.status === "done" && !o.completedAt) o.completedAt = o.touched || o.added || Date.now();
      return o;
    });
    S.schemaVersion = SCHEMA;
    return S;
  }

  // Pendientes: lo empezado primero (más reciente), después lo más reciente capturado.
  const sortPending = items => items.filter(x => x.status === "open").slice()
    .sort((a, b) => (b.started - a.started) || (b.started ? (b.touched || 0) - (a.touched || 0) : (b.added || 0) - (a.added || 0)));

  const sortHistory = items => items.filter(x => x.status === "done").slice()
    .sort((a, b) => (b.completedAt || 0) - (a.completedAt || 0));

  const api = { SCHEMA, defaultState, cleanTitle, parseLines, migrate, sortPending, sortHistory };
  if (typeof module !== "undefined" && module.exports) module.exports = api;
  else root.ARRANCA_CORE = api;
})(typeof globalThis !== "undefined" ? globalThis : this);
