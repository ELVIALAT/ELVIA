// Envelope unificado de respuestas de API (Fase 1, tarea 5).
//
// RETROCOMPAT (crítico): el frontend actual lee `res.error` como STRING
// (ej. `data.error === 'LIMIT_REACHED'`, `data.error.toLowerCase()`) y `res.mensaje`.
// Por eso `error` se mantiene como string. La forma estructurada nueva va en
// `error_detail: { code, message }`. En Fase 2, al migrar cada módulo y su
// consumidor frontend, se promueve `error_detail` y se elimina el string legacy.
//
// Forma de éxito:  { success: true,  data, error: null }
// Forma de error:  { success: false, data: null, error: <code>, mensaje, error_detail: { code, message } }

function ok(res, data = null, status = 200) {
  return res.status(status).json({ success: true, data, error: null });
}

function fail(res, { status = 400, code = 'BAD_REQUEST', message = 'Solicitud inválida', details = undefined } = {}) {
  return res.status(status).json({
    success: false,
    data: null,
    // legacy (string) — lo que el frontend ya consume
    error: code,
    mensaje: message,
    // forma estructurada nueva
    error_detail: { code, message, ...(details ? { details } : {}) },
  });
}

module.exports = { ok, fail };
