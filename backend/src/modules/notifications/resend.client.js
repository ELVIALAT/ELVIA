// Cliente Resend encapsulado (singleton). Devuelve null si no hay API key
// para que el módulo degrade con gracia en entornos sin email configurado.
const { Resend } = require('resend');

let _resend = null;
let _init = false;

function getResend() {
  if (_init) return _resend;
  _init = true;
  const key = process.env.RESEND_API_KEY;
  if (!key) {
    console.error('[notifications] RESEND_API_KEY no configurada — emails deshabilitados');
    return null;
  }
  try {
    _resend = new Resend(key);
  } catch (err) {
    console.error('[notifications] Error inicializando Resend:', err.message);
    _resend = null;
  }
  return _resend;
}

module.exports = { getResend };
