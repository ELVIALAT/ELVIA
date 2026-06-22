// backend/src/controllers/manualChatController.js
const { responderConManual } = require('../services/claudeManualService');

async function handleManualChat(req, res, next) {
  try {
    const { message, history } = req.body || {};

    if (!message || typeof message !== 'string' || message.trim().length === 0) {
      return res.status(400).json({ error: 'El campo message es requerido' });
    }
    if (message.length > 1000) {
      return res.status(400).json({ error: 'Mensaje demasiado largo (máximo 1000 caracteres)' });
    }

    const userContext = {
      isB2B: Boolean(req.user?.company_id),
      tenantSlug: req.user?.tenant_slug || null,
      userId: req.user?.id || null,
    };

    const result = await responderConManual({
      question: message.trim(),
      userContext,
      history: Array.isArray(history) ? history.slice(-6) : [],
    });

    return res.json({
      reply: result.respuesta,
      citas: result.citas,
      requiere_escalamiento: result.requiere_escalamiento,
    });
  } catch (err) {
    next(err);
  }
}

module.exports = { handleManualChat };
