// backend/src/services/claudeManualService.js
const Anthropic = require('@anthropic-ai/sdk');
const { getManualText } = require('../lib/loadManual');

const MODEL = process.env.CLAUDE_MANUAL_MODEL || 'claude-haiku-4-5-20251001';

let client = null;
if (!process.env.ANTHROPIC_API_KEY) {
  console.error('[claudeManualService] ANTHROPIC_API_KEY no configurada — Bot Modo Manual deshabilitado');
} else {
  try {
    client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
  } catch (e) {
    console.error('[claudeManualService] init error:', e.message);
  }
}

const INSTRUCCIONES_BASE = `Eres ELVIA, mentora de carrera 24/7 dentro de la plataforma ELVIA. Estás en "Modo Manual": tu única tarea es responder preguntas del usuario sobre CÓMO USAR la plataforma usando EXCLUSIVAMENTE la información del Manual de Uso que recibes a continuación.

REGLAS NO NEGOCIABLES:
1. CERO INVENCIÓN: Si la respuesta no está literal o claramente derivable del manual, responde "No encuentro esto en el manual oficial. Te conecto con un mentor experto para que te ayude." y marca requiere_escalamiento=true.
2. CITAS OBLIGATORIAS: Toda respuesta debe citar la(s) sección(es) del manual de donde sale la información, usando exactamente el título del heading. Si no puedes citar, escala.
3. TONO ELVIA: Español neutro hispanoamericano, cercano pero profesional. NUNCA digas "IA" — usa "ELVIA" o "yo".
4. CONFIDENCIALIDAD: Si el usuario pide subir CVs de terceros, niégate citando la nota del manual sobre tratamiento de datos.
5. FORMATO DE SALIDA: Responde SIEMPRE en JSON puro con esta estructura exacta:
{"respuesta": "texto markdown máximo 250 palabras", "citas": [{"seccion": "título exacto del heading", "anchor": "kebab-case-del-heading"}], "requiere_escalamiento": false}
6. LONGITUD: máximo 250 palabras en la respuesta.`;

function buildContextBlock(userContext) {
  const lines = [];
  if (userContext && userContext.isB2B) {
    lines.push(`Este usuario es B2B${userContext.tenantSlug ? ` (tenant: ${userContext.tenantSlug})` : ''}.`);
    lines.push('Omite menciones a limites de cuenta demo (ej. "10 generaciones"), planes B2C individuales, o precios Pricing.');
    lines.push('No menciones funciones que no aplican a su contrato corporativo.');
  } else {
    lines.push('Este usuario es B2C individual. Puedes mencionar todas las funciones documentadas en el manual.');
  }
  return lines.join('\n');
}

async function responderConManual({ question, userContext = {}, history = [] }) {
  if (!client) {
    return {
      respuesta: 'Modo Manual no disponible temporalmente. Intenta más tarde.',
      citas: [],
      requiere_escalamiento: true,
    };
  }

  const manualText = getManualText();
  const contextBlock = buildContextBlock(userContext);

  const system = [
    { type: 'text', text: INSTRUCCIONES_BASE },
    {
      type: 'text',
      text: `MANUAL DE USO — PLATAFORMA ELVIA (fuente única de verdad):\n\n${manualText}`,
      cache_control: { type: 'ephemeral' },
    },
    { type: 'text', text: `CONTEXTO DEL USUARIO ACTUAL:\n${contextBlock}` },
  ];

  const recentHistory = (history || []).slice(-6).map(m => ({
    role: m.role === 'assistant' ? 'assistant' : 'user',
    content: String(m.content || '').slice(0, 1500),
  }));

  const messages = [
    ...recentHistory,
    { role: 'user', content: question },
  ];

  let response;
  try {
    response = await client.messages.create({
      model: MODEL,
      max_tokens: 800,
      temperature: 0.2,
      system,
      messages,
    });
  } catch (err) {
    console.error('[claudeManualService] Anthropic error:', err.message);
    return {
      respuesta: 'Tuve un problema técnico al consultar el manual. Intenta de nuevo en un momento.',
      citas: [],
      requiere_escalamiento: true,
    };
  }

  const raw = response.content && response.content[0] ? response.content[0].text || '' : '';
  try {
    const parsed = JSON.parse(raw);
    return {
      respuesta: String(parsed.respuesta || raw),
      citas: Array.isArray(parsed.citas) ? parsed.citas : [],
      requiere_escalamiento: Boolean(parsed.requiere_escalamiento),
      _usage: response.usage || null,
    };
  } catch (_e) {
    return {
      respuesta: raw,
      citas: [],
      requiere_escalamiento: false,
      _usage: response.usage || null,
    };
  }
}

module.exports = { responderConManual };
