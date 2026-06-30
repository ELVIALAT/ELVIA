// Middleware: abre el store de contexto de IA (AsyncLocalStorage) al inicio del request.
// userId/tenant se llenan downstream (auth → setAiUser, dailyCap → setAiTenant) y los lee
// `complete()` para atribuir el costo de cada llamada de IA al tenant correcto.
// Debe montarse ANTES de las rutas para que el store exista cuando corra `auth` por-ruta.
const { runWithAiContext } = require('../platform/ai/context');

const aiContext = (req, res, next) => runWithAiContext(() => next());

module.exports = aiContext;
