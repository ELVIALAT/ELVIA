// Middleware de validación con Zod en los boundaries (Fase 1, tarea 4).
// Uso: router.post('/x', validate(schema), handler)
// Si el body es inválido → 400 con envelope unificado (no 500).
// Si es válido → req.body queda con los datos parseados (coercionados/limpios).
const { fail } = require('../lib/apiResponse');

function validate(schema, source = 'body') {
  return (req, res, next) => {
    const result = schema.safeParse(req[source]);
    if (!result.success) {
      // Primer issue para mensaje legible; todos en details.
      const issues = result.error.issues || [];
      const first = issues[0];
      const path = first?.path?.join('.') || source;
      return fail(res, {
        status: 400,
        code: 'VALIDATION_ERROR',
        message: first ? `${path}: ${first.message}` : 'Datos inválidos',
        details: issues.map(i => ({ path: i.path.join('.'), message: i.message })),
      });
    }
    req[source] = result.data;
    next();
  };
}

module.exports = { validate };
