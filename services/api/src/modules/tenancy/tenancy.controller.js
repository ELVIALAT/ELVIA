// tenancy.controller — capa HTTP del módulo company/tenancy.
//
// Reglas:
//  - SIEMPRE pasa req.companyId al service (que lo propaga al repository).
//  - Traduce DomainError → { status, error, code } sin filtrar detalle técnico.
//  - Conserva EXACTAMENTE los shapes de respuesta que consume CompanyAdmin.jsx.
//  - Si el cliente service_role no está configurado → 503.

const { getClient } = require('./tenancy.client')
const service = require('./tenancy.service')
const registration = require('./tenancy.registration.service')
const { DomainError } = registration

// Resuelve el cliente service_role o responde 503 si falta config.
function db(res) {
  const client = getClient()
  if (!client) {
    res.status(503).json({ error: 'Servicio no disponible' })
    return null
  }
  return client
}

// Traduce un error (DomainError o genérico) a respuesta HTTP.
// fallbackMsg: mensaje genérico para errores no-dominio (no filtra stack).
function sendError(res, err, fallbackMsg) {
  if (err instanceof DomainError) {
    const body = { error: err.message }
    if (err.code) body.code = err.code
    if (err.details) body.errors = err.details
    return res.status(err.status).json(body)
  }
  console.error('[tenancy]', fallbackMsg, err)
  return res.status(500).json({ error: fallbackMsg })
}

// ── Públicos ──────────────────────────────────────────────────────────────

// GET /registration/:slug  y  GET /branding/:slug (mismo handler)
async function getBySlug(req, res) {
  const client = db(res); if (!client) return
  try {
    const company = await service.getPublicCompanyBySlug(client, req.params.slug)
    res.json({ company })
  } catch (err) {
    sendError(res, err, 'Error al obtener datos de empresa')
  }
}

// POST /registration/:slug
async function register(req, res) {
  const client = db(res); if (!client) return
  try {
    const result = await registration.registerBySlug(client, req.params.slug, req.body)
    res.json(result)
  } catch (err) {
    if (err instanceof DomainError) return sendError(res, err)
    console.error('[Registration] Error registering company user:', err)
    res.status(500).json({
      error: 'No fue posible completar tu activación. Por favor intenta de nuevo o contacta a soporte si el problema persiste.',
      code: 'REGISTRATION_FAILED',
    })
  }
}

// GET /my-tenant (auth)
async function myTenant(req, res) {
  const client = db(res); if (!client) return
  try {
    const result = await service.getMyTenant(client, req.user.id)
    res.json(result)
  } catch (err) {
    sendError(res, err, 'Error al obtener tenant')
  }
}

// POST /confirm-activation (auth)
async function confirmActivation(req, res) {
  const client = db(res); if (!client) return
  try {
    const result = await registration.confirmActivation(client, { userId: req.user.id, userEmail: req.user.email })
    res.json(result)
  } catch (err) {
    sendError(res, err, 'Error al confirmar activación')
  }
}

// ── Usuarios (HR) ───────────────────────────────────────────────────────────

async function listUsers(req, res) {
  const client = db(res); if (!client) return
  try {
    const users = await service.listUsers(client, req.companyId)
    res.json({ users })
  } catch (err) {
    sendError(res, err, 'Error al obtener usuarios')
  }
}

async function createUser(req, res) {
  const client = db(res); if (!client) return
  try {
    const user = await service.createUser(client, req.companyId, req.body)
    res.json({ ok: true, user })
  } catch (err) {
    sendError(res, err, 'Error al crear usuario')
  }
}

async function updateUser(req, res) {
  const client = db(res); if (!client) return
  try {
    const user = await service.updateUser(client, req.companyId, req.user.id, req.params.id, req.body)
    res.json({ ok: true, user })
  } catch (err) {
    sendError(res, err, 'Error al actualizar usuario')
  }
}

async function deleteUser(req, res) {
  const client = db(res); if (!client) return
  try {
    await service.deleteUser(client, req.companyId, req.user, req.params.id)
    res.json({ ok: true })
  } catch (err) {
    sendError(res, err, 'Error al borrar usuario')
  }
}

// ── Invitaciones (HR) ───────────────────────────────────────────────────────

async function listInvitations(req, res) {
  const client = db(res); if (!client) return
  try {
    const invitations = await service.listInvitations(client, req.companyId)
    res.json({ invitations })
  } catch (err) {
    sendError(res, err, 'Error al obtener invitaciones')
  }
}

async function createInvitation(req, res) {
  const client = db(res); if (!client) return
  try {
    const result = await service.createInvitation(client, req.companyId, req.user.id, req.body)
    res.json(result)
  } catch (err) {
    sendError(res, err, 'Error al crear invitación')
  }
}

async function deleteInvitation(req, res) {
  const client = db(res); if (!client) return
  try {
    await service.deleteInvitation(client, req.companyId, req.params.id)
    res.json({ ok: true })
  } catch (err) {
    sendError(res, err, 'Error al eliminar invitación')
  }
}

// ── Perfil de empresa (HR) ──────────────────────────────────────────────────

async function getProfile(req, res) {
  const client = db(res); if (!client) return
  try {
    const company = await service.getProfile(client, req.companyId)
    res.json({ company })
  } catch (err) {
    sendError(res, err, 'Error al obtener perfil')
  }
}

async function updateProfile(req, res) {
  const client = db(res); if (!client) return
  try {
    const company = await service.updateProfile(client, req.companyId, req.body)
    res.json({ ok: true, company })
  } catch (err) {
    sendError(res, err, 'Error al actualizar perfil')
  }
}

// ── Dashboard / costos (HR) ─────────────────────────────────────────────────

async function dashboard(req, res) {
  const client = db(res); if (!client) return
  try {
    const stats = await service.getDashboardStats(client, req.companyId)
    res.json({ stats })
  } catch (err) {
    sendError(res, err, 'Error al obtener estadísticas')
  }
}

async function costs(req, res) {
  const client = db(res); if (!client) return
  try {
    const costs = await service.getCosts(client, req.companyId)
    res.json({ costs })
  } catch (err) {
    sendError(res, err, 'Error al obtener costos')
  }
}

async function exportCosts(req, res) {
  const client = db(res); if (!client) return
  try {
    const result = await service.exportCosts(client, req.companyId, {
      sendEmail: req.body.sendEmail,
      email: req.body.email,
      fallbackEmail: req.user.email,
    })
    res.json({ ok: true, ...result })
  } catch (err) {
    sendError(res, err, 'Error al exportar reporte')
  }
}

// ── Allowlist (HR) ──────────────────────────────────────────────────────────

async function getAllowlist(req, res) {
  const client = db(res); if (!client) return
  try {
    const allowlist = await service.getAllowlist(client, req.companyId)
    res.json({ allowlist })
  } catch (err) {
    sendError(res, err, 'Error al obtener allowlist')
  }
}

async function bulkAllowlist(req, res) {
  const client = db(res); if (!client) return
  try {
    const result = await service.bulkAllowlist(client, req.companyId, req.user.id, req.body || {})
    res.json({ ok: true, ...result })
  } catch (err) {
    sendError(res, err, 'Error al procesar allowlist')
  }
}

async function patchAllowlist(req, res) {
  const client = db(res); if (!client) return
  try {
    const entry = await service.patchAllowlist(client, req.companyId, req.user.id, req.params.id, (req.body || {}).action)
    res.json({ ok: true, entry })
  } catch (err) {
    sendError(res, err, 'Error al actualizar')
  }
}

async function deleteAllowlist(req, res) {
  const client = db(res); if (!client) return
  try {
    await service.deleteAllowlist(client, req.companyId, req.params.id)
    res.json({ ok: true })
  } catch (err) {
    sendError(res, err, 'Error al borrar')
  }
}

module.exports = {
  getBySlug,
  register,
  myTenant,
  confirmActivation,
  listUsers,
  createUser,
  updateUser,
  deleteUser,
  listInvitations,
  createInvitation,
  deleteInvitation,
  getProfile,
  updateProfile,
  dashboard,
  costs,
  exportCosts,
  getAllowlist,
  bulkAllowlist,
  patchAllowlist,
  deleteAllowlist,
}
