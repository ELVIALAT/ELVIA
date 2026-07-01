// Cliente Resend compartido + helpers de email.
// Portado verbatim desde services/resendService.js (que ahora es un facade sobre este módulo).
// Límite gratuito: 3000 emails/mes.
const { Resend } = require('resend');

let resend = null;
const _resendKey = process.env.RESEND_API_KEY;
if (!_resendKey) {
  console.error('[Resend] RESEND_API_KEY no configurada — emails deshabilitados');
} else {
  try {
    resend = new Resend(_resendKey);
  } catch (err) {
    console.error('[Resend] Error al inicializar cliente:', err.message);
  }
}
const FROM_EMAIL = 'Equipo ELVIA <noreply@elvia.lat>'; // Dominio verificado en Resend

// Escapa caracteres HTML para evitar XSS en emails generados con template strings
const escapeHtml = (str) =>
  String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;');

module.exports = { resend, FROM_EMAIL, escapeHtml };
