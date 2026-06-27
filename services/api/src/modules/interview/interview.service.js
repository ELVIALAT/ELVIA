// interview.service — lógica de negocio. No conoce HTTP; usa el repository.
const { generarPreguntasEntrevista, evaluarEntrevista } = require('../../services/deepseekService');
const repo = require('./interview.repository');

class ValidationError extends Error { constructor(m) { super(m); this.code = 'VALIDATION'; } }

// Genera las preguntas de la entrevista (negocio puro, sin DB).
async function generarPreguntas(body) {
  const { empresa, cargo, entrevistador, descripcion, numPreguntas, cv_base } = body;
  if (!cargo) throw new ValidationError('El campo cargo es requerido');

  const preguntas = await generarPreguntasEntrevista({
    empresa: empresa || 'la empresa',
    cargo,
    entrevistador: entrevistador || 'HR',
    descripcion: descripcion || '',
    numPreguntas: Math.min(Math.max(parseInt(numPreguntas) || 10, 5), 20),
    cv_base: cv_base || '',
  });
  return { preguntas };
}

// Evalúa la entrevista y persiste el reporte final (no el feedback por pregunta).
async function evaluar(db, userId, body) {
  const { empresa, cargo, entrevistador, preguntas, respuestas, feedbackPorPregunta } = body;
  if (!preguntas?.length || !respuestas?.length) {
    throw new ValidationError('Faltan preguntas o respuestas');
  }

  const resultado = await evaluarEntrevista({
    empresa: empresa || 'la empresa',
    cargo,
    entrevistador: entrevistador || 'HR',
    preguntas,
    respuestas,
    feedbackPorPregunta: !!feedbackPorPregunta,
  });

  // Solo guarda evaluaciones finales (no feedback por pregunta), best-effort.
  if (!feedbackPorPregunta && db && userId) {
    await repo.saveReport(db, userId, { resultado, preguntas, respuestas, cargo, empresa, entrevistador });
  }

  return resultado;
}

module.exports = { generarPreguntas, evaluar, ValidationError };
