// linkedin.controller — capa HTTP. Delega al service y mapea errores de dominio.
// Nota: estos endpoints devuelven shapes legacy directos (no envelope) porque
// el frontend LinkedinPro.jsx ya los consume así. Se migrarán al envelope en F3.
const svc = require('./linkedin.service');

async function getUsoMes(req, res, next) {
  try {
    return res.json(await svc.getUsoMes(req.supabase, req.user?.id));
  } catch (err) { next(err); }
}

async function analizarPerfil(req, res, next) {
  try {
    const resultado = await svc.analizarPerfil(req.supabase, req.user?.id, req.body);
    return res.json(resultado);
  } catch (err) {
    if (err.code === 'VALIDATION') return res.status(400).json({ error: err.message });
    if (err.code === 'MONTHLY_LIMIT') {
      return res.status(429).json({
        error: `Ya usaste tus ${svc.LIMITE_ANALISIS_MES} análisis de IA este mes. El contador se reinicia el 1º del próximo mes.`,
        codigo: 'limite_mensual_alcanzado',
        usados: err.usados,
        limite: svc.LIMITE_ANALISIS_MES,
        fecha_reset: svc.fechaResetMes(),
      });
    }
    next(err);
  }
}

async function getHistorial(req, res, next) {
  try {
    return res.json(await svc.getHistorial(req.supabase, req.user?.id));
  } catch (err) { next(err); }
}

async function extraerPerfilPDF(req, res, next) {
  try {
    const data = await svc.extraerPerfilPDF(req.supabase, req.user?.id, req.file?.buffer);
    return res.json(data);
  } catch (err) {
    if (err.code === 'VALIDATION' || err.code === 'IDENTITY_MISMATCH') {
      return res.status(400).json({ error: err.message });
    }
    next(err);
  }
}

async function getUltimoAnalisis(req, res, next) {
  try {
    return res.json(await svc.getUltimoAnalisis(req.supabase, req.user?.id));
  } catch (err) { next(err); }
}

async function guardarReporte(req, res, next) {
  try {
    if (!req.supabase || !req.user?.id) {
      return res.status(401).json({ error: 'Usuario no autenticado' });
    }
    return res.json(await svc.guardarReporte(req.supabase, req.user.id, req.body));
  } catch (err) {
    if (err.code === 'VALIDATION') return res.status(400).json({ error: err.message });
    next(err);
  }
}

module.exports = { getUsoMes, analizarPerfil, getHistorial, extraerPerfilPDF, getUltimoAnalisis, guardarReporte };
