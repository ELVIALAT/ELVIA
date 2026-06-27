// mentor.service — lógica de negocio del chat ELVIA.
// Dos modos: chat general (DeepSeek) y modo manual (responde solo con el manual).
// Sin repository: no toca Supabase; orquesta los services de IA.
const { generateChatResponse } = require('../../services/deepseekService');
const { responderConManual } = require('../../services/claudeManualService');

// Chat general: copilot conversacional con historial acotado.
async function chat({ message, history, context }) {
  const safeHistory = Array.isArray(history) ? history.slice(-10) : [];
  const reply = await generateChatResponse(message, safeHistory, context);
  return { reply };
}

// Chat modo manual: responde SOLO con el manual de ELVIA, con citas.
async function manualChat({ message, history, userContext }) {
  const result = await responderConManual({
    question: message.trim(),
    userContext,
    history: Array.isArray(history) ? history.slice(-6) : [],
  });
  return {
    reply: result.respuesta,
    citas: result.citas,
    requiere_escalamiento: result.requiere_escalamiento,
  };
}

module.exports = { chat, manualChat };
