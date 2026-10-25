// Servidor de IA de Arranca (función de Vercel).
// Guarda la clave de Anthropic en el servidor; la app solo manda el tipo de ayuda y los datos.
const PROMPTS = require("../prompts.js");

const MODEL = process.env.ARRANCA_MODEL || "claude-haiku-5-5";
const LIMIT_PER_HOUR = 60;        // peticiones por persona (IP) por hora
const hits = new Map();           // límite básico en memoria

function allowed(ip) {
  const now = Date.now(), hour = 3600e3;
  const list = (hits.get(ip) || []).filter(t => now - t < hour);
  if (list.length >= LIMIT_PER_HOUR) return false;
  list.push(now); hits.set(ip, list);
  return true;
}

function extractJSON(text) {
  try { return JSON.parse(text); } catch (e) {}
  const fence = text.match(/```(?:json)?\s*([\s\S]*?)```/);
  if (fence) { try { return JSON.parse(fence[1]); } catch (e) {} }
  const a = text.search(/[\[{]/), b = Math.max(text.lastIndexOf("]"), text.lastIndexOf("}"));
  if (a >= 0 && b > a) { try { return JSON.parse(text.slice(a, b + 1)); } catch (e) {} }
  return null;
}

module.exports = async (req, res) => {
  if (req.method !== "POST") return res.status(405).json({ error: "Usa POST" });
  const key = process.env.ANTHROPIC_API_KEY;
  if (!key) return res.status(503).json({ error: "Falta configurar ANTHROPIC_API_KEY en el servidor" });

  const ip = (req.headers["x-forwarded-for"] || "").split(",")[0].trim() || "anon";
  if (!allowed(ip)) return res.status(429).json({ error: "Demasiadas peticiones. Intenta en un rato." });

  let body = req.body;
  if (typeof body === "string") { try { body = JSON.parse(body); } catch (e) { body = {}; } }
  const { kind, payload } = body || {};
  const build = PROMPTS[kind];
  if (!build) return res.status(400).json({ error: "Tipo de ayuda desconocido" });

  try {
    const r = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: { "x-api-key": key, "anthropic-version": "2023-06-01", "content-type": "application/json" },
      body: JSON.stringify({ model: MODEL, max_tokens: 600, messages: [{ role: "user", content: build(payload || {}) }] })
    });
    if (!r.ok) return res.status(502).json({ error: "La IA no respondió", status: r.status });
    const data = await r.json();
    const text = (data.content || []).filter(c => c.type === "text").map(c => c.text).join("");
    const json = extractJSON(text);
    if (json === null) return res.status(502).json({ error: "Respuesta no válida" });
    return res.status(200).json({ result: json });
  } catch (e) {
    return res.status(502).json({ error: "Error de conexión con la IA" });
  }
};
