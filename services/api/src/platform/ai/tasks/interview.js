// Tasks de entrevista. Prompts/parsing portados verbatim desde deepseekService (camino vivo).
// generarPreguntasEntrevista lleva cv_base (CV crudo) → PII-lock a Claude (confidencialidad).
// evaluarEntrevista es feedback premium sin CV → Sonnet objetivo (DeepSeek en aterrizaje).
const { complete } = require('../complete');
const { TASKS } = require('../policy');

// ── Genera preguntas de entrevista (EXTRACCIÓN/GEN, PII-lock por cv_base) ────
async function generarPreguntasEntrevista({ empresa, cargo, entrevistador, descripcion, numPreguntas, cv_base }, ctx = {}) {
  const tecnicas = Math.ceil(numPreguntas * 0.5);
  const soft = numPreguntas - tecnicas;

  const cvSection = cv_base
    ? `\nCV del candidato (úsalo para personalizar las preguntas a su experiencia real):\n${cv_base.substring(0, 3000)}\n`
    : '';

  const prompt = `Eres un experto en procesos de selección en LATAM. Genera exactamente ${numPreguntas} preguntas de entrevista para el siguiente perfil:

Empresa: ${empresa}
Cargo: ${cargo}
Tipo de entrevistador: ${entrevistador}
Descripción de la vacante: ${descripcion || 'No proporcionada'}${cvSection}

DISTRIBUCIÓN OBLIGATORIA:
- ${tecnicas} preguntas técnicas (conocimientos, experiencia, habilidades del cargo)
- ${soft} preguntas de soft skills (liderazgo, trabajo en equipo, manejo de conflictos, etc.)

REGLAS:
- Las preguntas deben ser abiertas (no sí/no)
- Adapta la dificultad al nivel del cargo
- Si el entrevistador es Headhunter, enfócate más en logros y propuesta de valor
- Si es HR, incluye preguntas de cultura y motivación
- Si es Hiring Manager, enfócate en habilidades técnicas y casos prácticos
- Las preguntas deben ser en español

Responde ÚNICAMENTE con un JSON array con este formato exacto (sin texto extra):
[
  { "id": 1, "pregunta": "...", "tipo": "tecnica" },
  { "id": 2, "pregunta": "...", "tipo": "soft" }
]`;

  const text = await complete({
    task: TASKS.INTERVIEW_PREGUNTAS,
    messages: [{ role: 'user', content: prompt }],
    maxTokens: 1500,
    tenant: ctx.tenant,
  });

  const jsonMatch = text.trim().match(/\[[\s\S]*\]/);
  if (!jsonMatch) throw new Error('No se pudo parsear las preguntas');
  return JSON.parse(jsonMatch[0]);
}

// ── Evalúa las respuestas de la entrevista (PREMIUM no-PII) ──────────────────
async function evaluarEntrevista({ empresa, cargo, entrevistador, preguntas, respuestas, feedbackPorPregunta }, ctx = {}) {
  const pares = preguntas.map((p, i) => `P${i + 1} [${p.tipo}]: ${p.pregunta}\nR: ${respuestas[i] || '(sin respuesta)'}`).join('\n\n');

  const prompt = `Eres un experto evaluador de entrevistas en LATAM. Evalúa las respuestas de esta entrevista y estructura el feedback en 4 secciones:

Cargo: ${cargo} en ${empresa}
Tipo de entrevistador: ${entrevistador}

PREGUNTAS Y RESPUESTAS:
${pares}

Evalúa las respuestas en estas 4 áreas:
- SECCIÓN 1: PRESENTACIÓN PERSONAL (¿El candidato se presentó bien? ¿Comunicó con claridad?)
- SECCIÓN 2: CASOS Y LOGROS (¿Usó ejemplos concretos y métricas? ¿Demostró impacto?)
- SECCIÓN 3: HABILIDADES TÉCNICAS (¿Demostró competencias para el cargo? ¿Profundidad técnica?)
- SECCIÓN 4: CIERRE Y PREGUNTAS (¿Cerró bien la entrevista? ¿Hizo preguntas inteligentes?)

Responde ÚNICAMENTE con este JSON (sin texto adicional):
{
  "puntuacion": <0-100>,
  "resumen": "<párrafo de 2-3 oraciones con evaluación general>",
  "secciones": [
    {
      "titulo": "Presentación Personal",
      "puntuacion": <0-10>,
      "feedback": "<feedback específico de 2-3 oraciones>",
      "fortalezas": ["<fortaleza 1>", "<fortaleza 2>"],
      "areas_mejora": ["<mejora 1>", "<mejora 2>"]
    },
    {
      "titulo": "Casos y Logros",
      "puntuacion": <0-10>,
      "feedback": "<feedback>",
      "fortalezas": [],
      "areas_mejora": []
    },
    {
      "titulo": "Habilidades Técnicas",
      "puntuacion": <0-10>,
      "feedback": "<feedback>",
      "fortalezas": [],
      "areas_mejora": []
    },
    {
      "titulo": "Cierre y Preguntas",
      "puntuacion": <0-10>,
      "feedback": "<feedback>",
      "fortalezas": [],
      "areas_mejora": []
    }
  ],
  "recomendaciones": ["<recomendación práctica 1>", "<recomendación 2>", "<recomendación 3>"],
  ${feedbackPorPregunta ? `"detalle": [
    { "id": <número>, "pregunta": "<pregunta>", "calificacion": <1-5>, "comentario": "<feedback específico>" }
  ]` : '"detalle": []'}
}`;

  const text = await complete({
    task: TASKS.INTERVIEW_EVALUAR,
    messages: [{ role: 'user', content: prompt }],
    maxTokens: 2000,
    tenant: ctx.tenant,
  });

  const cleaned = text.trim().replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/, '').trim();
  const jsonMatch = cleaned.match(/\{[\s\S]*\}/);
  if (!jsonMatch) throw new Error('No se pudo parsear la evaluación');
  return JSON.parse(jsonMatch[0]);
}

module.exports = { generarPreguntasEntrevista, evaluarEntrevista };
