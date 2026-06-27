// Tests del middleware requireTenantContext.
//
// Es la compuerta que garantiza la invariante "ninguna ruta de tenant corre con
// companyId nulo". Importa porque un super_admin tiene req.companyId = null
// (requireAdmin.js): sin este gate, una ruta HR llegaría al repository con
// companyId falsy. tenantQuery ya lanza en ese caso, pero este middleware
// convierte el fallo en un 400 limpio ANTES de tocar dato alguno (defensa en
// profundidad). Es una función pura de req.companyId → corre en CI sin staging.

const requireTenantContext = require('../../src/middleware/requireTenantContext')

// Mock mínimo de res con status()/json() encadenables.
function mockRes() {
  const res = {
    statusCode: null,
    body: null,
    status(code) { res.statusCode = code; return res },
    json(payload) { res.body = payload; return res },
  }
  return res
}

describe('requireTenantContext', () => {
  test('companyId undefined → 400 MISSING_TENANT_CONTEXT y NO llama next', () => {
    const req = {}
    const res = mockRes()
    const next = jest.fn()

    requireTenantContext(req, res, next)

    expect(res.statusCode).toBe(400)
    expect(res.body.code).toBe('MISSING_TENANT_CONTEXT')
    expect(next).not.toHaveBeenCalled()
  })

  test('companyId null (el valor que requireRole asigna a super_admin) → 400 y NO llama next', () => {
    const req = { companyId: null }
    const res = mockRes()
    const next = jest.fn()

    requireTenantContext(req, res, next)

    expect(res.statusCode).toBe(400)
    expect(res.body.code).toBe('MISSING_TENANT_CONTEXT')
    expect(next).not.toHaveBeenCalled()
  })

  test('companyId presente → llama next una vez y NO responde error', () => {
    const req = { companyId: 'company-aaaa' }
    const res = mockRes()
    const next = jest.fn()

    requireTenantContext(req, res, next)

    expect(next).toHaveBeenCalledTimes(1)
    expect(res.statusCode).toBeNull()
  })
})
