// tenants.controller — capa HTTP del sub-módulo tenants (super_admin).
// Traduce DomainError → HTTP y conserva los shapes del routes/admin.js original.

const service = require('./tenants.service')
const { DomainError } = service

function sendError(res, err, fallbackMsg) {
  if (err instanceof DomainError) {
    const body = { error: err.message }
    if (err.code) body.code = err.code
    return res.status(err.status).json(body)
  }
  console.error('[admin/tenants]', fallbackMsg, err?.message || err)
  return res.status(500).json({ error: fallbackMsg })
}

async function listCompanies(req, res) {
  try {
    const companies = await service.listCompanies()
    res.json({ companies })
  } catch (err) {
    sendError(res, err, 'Error listando empresas')
  }
}

async function patchCompany(req, res) {
  try {
    const company = await service.patchCompany(req.params.id, req.body, req.user.id)
    res.json({ company })
  } catch (err) {
    sendError(res, err, 'Error actualizando empresa')
  }
}

async function uploadLogo(req, res) {
  try {
    const which = req.query.which === 'secondary' ? 'secondary' : 'primary'
    const result = await service.uploadLogo(req.params.id, req.file, which, req.user.id)
    res.json({ ok: true, ...result })
  } catch (err) {
    sendError(res, err, 'Error procesando logo')
  }
}

async function checkSlug(req, res) {
  try {
    const result = await service.checkSlug(req.params.slug)
    res.json(result)
  } catch (err) {
    // El original devolvía 500 con err.message crudo aquí.
    res.status(500).json({ error: err.message })
  }
}

async function createTenant(req, res) {
  try {
    const result = await service.createTenant(req.body, req.user.id)
    res.status(201).json(result)
  } catch (err) {
    sendError(res, err, 'Error creando tenant')
  }
}

module.exports = {
  listCompanies,
  patchCompany,
  uploadLogo,
  checkSlug,
  createTenant,
}
