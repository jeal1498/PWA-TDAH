const test = require("node:test");
const assert = require("node:assert");
const C = require("../core.js");

test("brain dump: 5 líneas con contenido y 2 vacías crean exactamente 5", () => {
  const r = C.parseLines("  a \n\n b\n   \nc\r\nd\ne  ");
  assert.deepStrictEqual(r, ["a", "b", "c", "d", "e"]);
});

test("cleanTitle: vacío o espacios no crea título", () => {
  assert.strictEqual(C.cleanTitle("   "), "");
  assert.strictEqual(C.cleanTitle(null), "");
  assert.strictEqual(C.cleanTitle("  Pagar luz "), "Pagar luz");
});

test("migrate: conserva datos v4 y agrega completedAt/source/schemaVersion", () => {
  const old = { done: [0, "0-1"], xp: 7, inbox: [
    { id: 1, t: "A", steps: [{ s: "x", m: 2 }], idx: 1, status: "open", started: true, added: 1, touched: 5 },
    { id: 2, t: "B", steps: [{ s: "y", m: 2 }], idx: 1, status: "done", started: true, added: 2, touched: 9 }
  ] };
  const S = C.migrate(old);
  assert.strictEqual(S.schemaVersion, 5);
  assert.deepStrictEqual(S.done, ["0-0", "0-1"]);
  assert.strictEqual(S.xp, 7);
  assert.strictEqual(S.inbox[0].steps[0].s, "x");
  assert.strictEqual(S.inbox[0].completedAt, undefined);
  assert.strictEqual(S.inbox[1].completedAt, 9);
  assert.strictEqual(S.inbox[1].source, "quick_capture");
});

test("migrate: entrada inválida da estado por defecto", () => {
  assert.strictEqual(C.migrate(null).inbox.length, 0);
  assert.strictEqual(C.migrate({ inbox: "x" }).inbox.length, 0);
});

test("sortPending: empezadas primero, luego más recientes; excluye hechas y archivadas", () => {
  const items = [
    { id: 1, status: "open", started: false, added: 1 },
    { id: 2, status: "open", started: true, touched: 5, added: 0 },
    { id: 3, status: "open", started: false, added: 3 },
    { id: 4, status: "done", started: true, added: 4 },
    { id: 5, status: "archived", started: false, added: 5 }
  ];
  assert.deepStrictEqual(C.sortPending(items).map(x => x.id), [2, 3, 1]);
});

test("sortHistory: más reciente primero", () => {
  const items = [{ id: 1, status: "done", completedAt: 1 }, { id: 2, status: "done", completedAt: 9 }, { id: 3, status: "open" }];
  assert.deepStrictEqual(C.sortHistory(items).map(x => x.id), [2, 1]);
});

const mk = (extra = {}) => Object.assign({ id: 1, t: "T", status: "open", started: true, added: 1, touched: 1, steps: null }, extra);

test("suggestSteps: granularidad cambia la cantidad; sin duplicados ni pasos vacíos", () => {
  const n = g => C.suggestSteps("Preparar informe", g);
  assert.ok(n("few").length >= 3 && n("few").length <= 4);
  assert.ok(n("balanced").length >= 4 && n("balanced").length <= 6);
  assert.ok(n("detailed").length >= 6 && n("detailed").length <= 10);
  assert.strictEqual(n().length, n("balanced").length);
  const all = n("detailed").map(x => x.s);
  assert.strictEqual(new Set(all).size, all.length);
  assert.deepStrictEqual(C.suggestSteps("   "), []);
  assert.ok(C.suggestSteps("x".repeat(200))[0].s.length < 90);
});

test("validateStep: rechaza vacío, vago y duplicado", () => {
  const steps = [{ id: 1, s: "Abrir el correo" }];
  assert.strictEqual(C.validateStep(steps, "  ").reason, "vacio");
  assert.strictEqual(C.validateStep(steps, "Hacer la tarea").reason, "vago");
  assert.strictEqual(C.validateStep(steps, "abrir el correo").reason, "duplicado");
  assert.strictEqual(C.validateStep(steps, "abrir el correo", 1).ok, true);
  assert.strictEqual(C.validateStep(steps, " Escribir asunto ").title, "Escribir asunto");
});

test("pasos: agregar, editar, reordenar, eliminar y completar fuera de orden", () => {
  const it = mk();
  const a = C.addStep(it, "A"), b = C.addStep(it, "B"), c = C.addStep(it, "C");
  assert.strictEqual(it.idx, 0);
  C.moveStep(it, c.id, -1); assert.deepStrictEqual(it.steps.map(x => x.s), ["A", "C", "B"]);
  assert.strictEqual(C.moveStep(it, a.id, -1), false);
  C.renameStep(it, b.id, "B2");
  assert.strictEqual(C.toggleStep(it, b.id), false);           // fuera de orden
  assert.strictEqual(it.idx, 0);
  C.toggleStep(it, a.id); assert.strictEqual(it.idx, 1);        // siguiente = C
  assert.strictEqual(C.toggleStep(it, c.id), true);             // todos hechos
  C.toggleStep(it, c.id); assert.strictEqual(it.steps[it.idx].s, "C"); // deshacer
  C.removeStep(it, c.id); assert.strictEqual(it.idx, 2);
});

test("siguiente acción: paso elegido > primer pendiente > tarea sin pasos > null", () => {
  const t1 = mk({ id: 1, touched: 9 }); C.addStep(t1, "A"); const b = C.addStep(t1, "B");
  const t2 = mk({ id: 2, touched: 5 });
  let r = C.nextAction([t1, t2], 1);
  assert.strictEqual(r.step.s, "A");
  t1.sel = b.id; r = C.nextAction([t1, t2], 1);
  assert.strictEqual(r.step.s, "B"); assert.strictEqual(r.explicit, true);
  C.toggleStep(t1, b.id); C.toggleStep(t1, t1.steps[0].id);    // todo hecho
  t1.status = "done";
  r = C.nextAction([t1, t2], null);
  assert.strictEqual(r.task.id, 2); assert.strictEqual(r.step, null);
  assert.strictEqual(C.nextAction([mk({ started: false })], null), null);
});

test("migrate: pasos v4 reciben id y estado según idx", () => {
  const S = C.migrate({ inbox: [{ id: 1, t: "A", steps: [{ s: "a", m: 2 }, { s: "b", m: 2 }, { s: "c", m: 2 }], idx: 1, status: "open", started: true }] });
  const it = S.inbox[0];
  assert.deepStrictEqual(it.steps.map(x => x.d), [true, false, false]);
  assert.strictEqual(it.idx, 1);
  assert.strictEqual(C.addStep(it, "d").id, 4);
});

test("sesión: pausar y continuar conservan el tiempo restante", () => {
  const t0 = 1_000_000;
  const se = C.startSession({ taskId: 1, stepId: 2, minutes: 5 }, t0);
  assert.strictEqual(C.remaining(se, t0 + 60_000), 240);
  C.pauseSession(se, t0 + 60_000);
  assert.strictEqual(se.status, "paused");
  assert.strictEqual(C.remaining(se, t0 + 999_999_999), 240);   // en pausa no corre
  C.resumeSession(se, t0 + 500_000);
  assert.strictEqual(C.remaining(se, t0 + 530_000), 210);
});

test("sesión: termina por tiempo y no completa tareas; reloj atrás/adelante", () => {
  const t0 = 5_000_000;
  const se = C.startSession({ taskId: 1, minutes: 2 }, t0);
  assert.strictEqual(C.remaining(se, t0 - 3_600_000), 120);     // reloj atrás: tope en la duración
  assert.strictEqual(C.syncSession(se, t0 + 119_000), false);
  assert.strictEqual(C.syncSession(se, t0 + 3_600_000), true);  // reloj adelante / suspensión
  assert.strictEqual(se.status, "completed");
  assert.strictEqual(se.endedAt, t0 + 120_000);
  assert.strictEqual(C.remaining(se, t0 + 9e9), 0);
});

test("sesión: terminar antes registra o descarta; duración solo en pausa", () => {
  const t0 = 1000;
  const a = C.startSession({ minutes: 10 }, t0), b = C.startSession({ minutes: 10 }, t0);
  C.endSession(a, t0 + 5000, true); C.endSession(b, t0 + 5000, false);
  assert.strictEqual(a.status, "completed"); assert.strictEqual(b.status, "abandoned");
  const c = C.startSession({ minutes: 5 }, t0);
  C.setDuration(c, 15); assert.strictEqual(c.durationSeconds, 300);
  C.pauseSession(c, t0 + 1000); C.setDuration(c, 15);
  assert.strictEqual(c.remainingSeconds, 900); assert.strictEqual(C.startSession({ minutes: 7 }, t0).durationSeconds, 300);
});

test("migrate: sesión válida se conserva, inválida se descarta; sin texto de tareas", () => {
  const ok = C.startSession({ taskId: 1, stepId: 1, minutes: 5 }, 1000);
  assert.strictEqual(C.migrate({ session: ok }).session.status, "running");
  assert.strictEqual(C.migrate({ session: { status: "x" } }).session, null);
  assert.strictEqual(C.migrate({ session: { status: "running", durationSeconds: 300 } }).session.status, "paused");
  assert.strictEqual(C.migrate({ timerMin: 7 }).timerMin, null);
  assert.deepStrictEqual(Object.keys(ok).sort(), ["durationSeconds","endedAt","endsAt","id","pausedAt","remainingSeconds","startedAt","status","stepId","taskId"]);
});
