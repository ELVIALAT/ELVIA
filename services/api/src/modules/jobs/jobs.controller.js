// jobs.controller — capa HTTP. Delega al service; los DomainError llevan su status.
const svc = require('./jobs.service');

function handleDomainError(err, res, next) {
  if (typeof err.status === 'number') {
    const body = { error: err.message };
    if (err.maxChars) body.maxChars = err.maxChars;
    return res.status(err.status).json(body);
  }
  next(err);
}

async function fetchUrl(req, res, next) {
  try {
    return res.json(await svc.fetchJobUrl(req.body.url));
  } catch (err) {
    console.error('[jobs/fetch-url]', err.message);
    if (typeof err.status === 'number') return handleDomainError(err, res, next);
    return res.status(500).json({ error: 'No se pudo obtener la página. Intenta pegar la descripción manualmente.' });
  }
}

async function similar(req, res, next) {
  try {
    const q = req.query;
    const companiesParam = q.companies;
    const companies = companiesParam
      ? (Array.isArray(companiesParam) ? companiesParam : [companiesParam]).map(c => c.trim()).filter(Boolean).slice(0, 5)
      : [];
    return res.json(await svc.findSimilar({ ...q, companies }));
  } catch (err) {
    if (typeof err.status === 'number') return handleDomainError(err, res, next);
    console.error('[jobs/similar]', err.message);
    return res.status(500).json({ error: 'Error al buscar vacantes' });
  }
}

async function compatibility(req, res, next) {
  try {
    return res.json(await svc.checkCompatibility(req.supabase, req.user.id, req.body));
  } catch (err) {
    if (typeof err.status === 'number') return handleDomainError(err, res, next);
    console.error('[jobs/compatibility]', err.message);
    return res.status(500).json({ error: 'Error al calcular compatibilidad' });
  }
}

module.exports = { fetchUrl, similar, compatibility };
