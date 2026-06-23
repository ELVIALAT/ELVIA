// mentor.controller — capa HTTP. Delega al service.
const svc = require('./mentor.service');

async function chat(req, res, next) {
  try {
    const { message, history, context } = req.body; // validado por Zod
    return res.json(await svc.chat({ message, history, context }));
  } catch (err) { next(err); }
}

async function manualChat(req, res, next) {
  try {
    const { message, history } = req.body; // validado por Zod
    const userContext = {
      isB2B: Boolean(req.user?.company_id),
      tenantSlug: req.user?.tenant_slug || null,
      userId: req.user?.id || null,
    };
    return res.json(await svc.manualChat({ message, history, userContext }));
  } catch (err) { next(err); }
}

module.exports = { chat, manualChat };
