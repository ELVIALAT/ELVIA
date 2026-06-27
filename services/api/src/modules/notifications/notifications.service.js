// notifications.service — lógica de negocio del módulo.
// No conoce HTTP (req/res) ni toca Supabase directo: usa el repository.
const { getOwnedCv } = require('./notifications.repository');
const { cvReadyEmail } = require('./templates/cvReady');

// Errores de dominio con código (el controller los mapea a HTTP).
class NotFoundError extends Error { constructor(msg) { super(msg); this.code = 'NOT_FOUND'; } }

function buildFileName(contenido, metadata, extension) {
  const nombre = contenido?.split('\n')[0]?.trim() || 'CV';
  const lang = metadata?.language || 'es';
  const fecha = new Date()
    .toLocaleDateString('es-MX', { day: '2-digit', month: '2-digit', year: '2-digit' })
    .replace(/\//g, '');
  return lang === 'en'
    ? `Optimized CV ${nombre} ${fecha}.${extension}`
    : `CV Optimizado ${nombre} ${fecha}.${extension}`;
}

/**
 * Envía por email el CV del usuario (PDF o Word).
 * @param {object} deps - { db, resend } inyectados por el controller
 * @param {object} params - { to, cvId, format, userId }
 */
async function sendCvByEmail({ db, resend }, { to, cvId, format, userId }) {
  const cv = await getOwnedCv(db, cvId, userId);
  if (!cv) throw new NotFoundError('CV no encontrado');

  // Generar el documento en el formato pedido
  let buffer, extension;
  if (format === 'word') {
    const { generarWord } = require('../../services/wordService');
    buffer = await generarWord(cv.contenido);
    extension = 'docx';
  } else {
    const { generarPDF } = require('../../services/pdfService');
    buffer = await generarPDF(cv.contenido);
    extension = 'pdf';
  }

  const lang = cv.metadata?.language || 'es';
  const filename = buildFileName(cv.contenido, cv.metadata, extension);

  await resend.emails.send({
    from: 'ELVIA <soporte@elvia.lat>',
    to: [to],
    subject: lang === 'en' ? 'Your Optimized CV is ready' : 'Tu CV optimizado está listo',
    html: cvReadyEmail({ format }),
    attachments: [{ filename, content: buffer }],
  });
}

module.exports = { sendCvByEmail, NotFoundError };
