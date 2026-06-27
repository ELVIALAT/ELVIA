// PII Shield para Sentry (Promesa #1: confidencialidad absoluta).
// Elimina datos personales de los eventos antes de enviarlos a Sentry:
// request bodies, headers de auth, query strings, y PII por patrón en strings.

const EMAIL_RE = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g;
// JWT (Supabase) y bearer tokens
const TOKEN_RE = /\b(eyJ[a-zA-Z0-9_-]{10,}\.[a-zA-Z0-9_-]{10,}\.[a-zA-Z0-9_-]{10,})\b/g;
// Teléfonos largos (8+ dígitos seguidos, con separadores opcionales)
const PHONE_RE = /\b[\d][\d\s().-]{7,}\d\b/g;

const SENSITIVE_HEADERS = ['authorization', 'cookie', 'set-cookie', 'x-api-key', 'apikey'];

function redactString(str) {
  if (typeof str !== 'string') return str;
  return str
    .replace(TOKEN_RE, '[REDACTED_TOKEN]')
    .replace(EMAIL_RE, '[REDACTED_EMAIL]')
    .replace(PHONE_RE, '[REDACTED_PHONE]');
}

function scrubRequest(req) {
  if (!req || typeof req !== 'object') return req;
  // Nunca enviar el body (puede contener CVs, datos personales, credenciales)
  if ('data' in req) req.data = '[REDACTED_BODY]';
  // Quitar query string (puede llevar tokens o emails)
  if (typeof req.query_string === 'string') req.query_string = '[REDACTED]';
  // Redactar headers sensibles
  if (req.headers && typeof req.headers === 'object') {
    for (const h of Object.keys(req.headers)) {
      if (SENSITIVE_HEADERS.includes(h.toLowerCase())) req.headers[h] = '[REDACTED]';
    }
  }
  // Redactar el path por si lleva email/id en la URL
  if (typeof req.url === 'string') req.url = redactString(req.url);
  return req;
}

function scrubEvent(event) {
  try {
    // No mandar info del usuario (email, ip, id)
    delete event.user;

    if (event.request) event.request = scrubRequest(event.request);

    // Redactar el mensaje principal
    if (typeof event.message === 'string') event.message = redactString(event.message);

    // Redactar mensajes de excepción y stack values
    if (event.exception?.values) {
      for (const ex of event.exception.values) {
        if (typeof ex.value === 'string') ex.value = redactString(ex.value);
      }
    }

    // Redactar breadcrumbs (pueden llevar urls/bodies con PII)
    if (event.breadcrumbs) {
      for (const b of event.breadcrumbs) {
        if (typeof b.message === 'string') b.message = redactString(b.message);
        if (b.data && typeof b.data === 'object') delete b.data.body;
      }
    }
  } catch {
    // Si el scrubbing falla, es más seguro descartar el evento que filtrar PII.
    return null;
  }
  return event;
}

module.exports = { scrubEvent, redactString };
