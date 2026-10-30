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
