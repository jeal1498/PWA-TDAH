// Instrucciones para la IA. Las comparten la app y el servidor (api/ai.js).
(function (root) {
  const clip = (s, n) => String(s || "").slice(0, n);
  const P = {
    steps: ({ task }) =>
      `Eres un apoyo para adultos con TDAH. Divide esta tarea en 3 a 6 pasos muy pequeños, concretos y físicos, en español de México, tono amable. Cada paso debe durar entre 2 y 5 minutos y el primero debe ser ridículamente fácil. Responde solo un arreglo JSON de objetos {"s": texto del paso (máx 12 palabras), "m": minutos (2-5)}.\n\nTarea: ${clip(task, 300)}`,
    mini: ({ step, task }) =>
      `Un adulto con TDAH no logra empezar este paso: "${clip(step, 200)}" (de la tarea "${clip(task, 300)}"). Propón UN paso aún más pequeño que tome menos de 1 minuto, físico y concreto, y una frase breve y compasiva. Responde solo JSON {"s": paso (máx 10 palabras), "f": frase (máx 14 palabras)}.`,
    rank: ({ items }) =>
      `Ayudas a un adulto con TDAH a decidir qué hacer AHORA. Ordena estos pendientes del más conveniente para empezar ahora al menos conveniente, considerando urgencia, consecuencias de no hacerlo y qué tan fácil es arrancar. Las tareas marcadas [empezada] cuestan menos de retomar. Responde solo un arreglo JSON de objetos {"i": índice, "why": razón amable en español de México, máx 15 palabras}.\n\n` +
      (Array.isArray(items) ? items.slice(0, 30) : []).map((x, i) => i + ". " + clip(x.t, 200) + (x.started ? " [empezada]" : "")).join("\n")
  };
  if (typeof module !== "undefined" && module.exports) module.exports = P;
  else root.ARRANCA_PROMPTS = P;
})(typeof globalThis !== "undefined" ? globalThis : this);
