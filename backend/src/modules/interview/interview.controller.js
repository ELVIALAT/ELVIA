// interview.controller — capa HTTP. Delega al service y mapea errores.
const svc = require('./interview.service');

async function generarPreguntas(req, res, next) {
  try {
    return res.json(await svc.generarPreguntas(req.body));
  } catch (err) {
    if (err.code === 'VALIDATION') return res.status(400).json({ error: err.message });
    next(err);
  }
}

async function evaluar(req, res, next) {
  try {
    return res.json(await svc.evaluar(req.supabase, req.user?.id, req.body));
  } catch (err) {
    if (err.code === 'VALIDATION') return res.status(400).json({ error: err.message });
    next(err);
  }
}

module.exports = { generarPreguntas, evaluar };
