// notifications.controller — capa HTTP. Traduce req/res ↔ service.
// No tiene lógica de negocio ni queries; delega al service y mapea errores.
const { ok, fail } = require('../../lib/apiResponse');
const { sendCvByEmail } = require('./notifications.service');
const { getResend } = require('./resend.client');

async function postSendCv(req, res) {
  const { to, cvId, format } = req.body; // ya validado por Zod
  const resend = getResend();
  if (!resend) {
    return fail(res, { status: 503, code: 'EMAIL_DISABLED', message: 'Servicio de email no disponible' });
  }
  try {
    await sendCvByEmail(
      { db: req.supabase, resend },
      { to, cvId, format, userId: req.user.id }
    );
    return ok(res, { mensaje: 'Email enviado correctamente' });
  } catch (err) {
    if (err.code === 'NOT_FOUND') {
      return fail(res, { status: 404, code: 'NOT_FOUND', message: err.message });
    }
    console.error('[notifications/send]', err.message);
    return fail(res, { status: 500, code: 'EMAIL_SEND_FAILED', message: 'Error al enviar el email' });
  }
}

module.exports = { postSendCv };
