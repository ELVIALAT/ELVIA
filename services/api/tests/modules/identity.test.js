// Tests del módulo identity. La resolución de rol vivía inline en el middleware
// requireAdmin (intesteable); extraída a identity.service ahora se prueba en
// aislamiento, cubriendo las 3 ramas: super_admin, company_admin (con/sin MFA)
// y sin acceso.

const service = require('../../src/modules/identity/identity.service')
const fs = require('fs')
const path = require('path')

// Mock del cliente Supabase autenticado. Cada tabla devuelve una fila fija.
// .from(t).select(...).eq(...).single()/.maybeSingle()
function mockDb(rows = {}) {
  const make = (table) => {
    const chain = {
      select() { return chain },
      eq() { return chain },
      single: async () => (rows[table]
        ? { data: rows[table], error: null }
        : { data: null, error: { message: 'no rows' } }),
      maybeSingle: async () => ({ data: rows[table] ?? null, error: null }),
    }
    return chain
  }
  return { from: make }
}

describe('identity.service — resolveAdminContext', () => {
  test('super_admin desde administrators (no consulta MFA)', async () => {
    const db = mockDb({ administrators: { role: 'super_admin' } })
    const ctx = await service.resolveAdminContext(db, 'u-super')
    expect(ctx).toEqual({ role: 'super_admin', companyId: null, profile: { role: 'super_admin' }, mfaRequired: false })
  })

  test('company_admin con company_id y empresa que exige MFA', async () => {
    const db = mockDb({
      administrators: null, // no es super_admin
      profiles: { role: 'company_admin', company_id: 'co-1' },
      companies: { require_mfa: true },
    })
    const ctx = await service.resolveAdminContext(db, 'u-hr')
    expect(ctx.role).toBe('company_admin')
    expect(ctx.companyId).toBe('co-1')
    expect(ctx.mfaRequired).toBe(true)
  })

  test('company_admin sin MFA (empresa no lo exige)', async () => {
    const db = mockDb({
      administrators: null,
      profiles: { role: 'company_admin', company_id: 'co-2' },
      companies: { require_mfa: false },
    })
    const ctx = await service.resolveAdminContext(db, 'u-hr2')
    expect(ctx.mfaRequired).toBe(false)
  })

  test('user normal (rol user) → role=user, sin MFA si no tiene company', async () => {
    const db = mockDb({
      administrators: null,
      profiles: { role: 'user', company_id: null },
    })
    const ctx = await service.resolveAdminContext(db, 'u-normal')
    expect(ctx.role).toBe('user')
    expect(ctx.companyId).toBeNull()
    expect(ctx.mfaRequired).toBe(false)
  })

  test('sin registro en administrators ni profiles → role null (sin acceso)', async () => {
    const db = mockDb({ administrators: null, profiles: null })
    const ctx = await service.resolveAdminContext(db, 'u-ghost')
    expect(ctx.role).toBeNull()
  })

  test('administrators con role != super_admin NO concede super_admin', async () => {
    // p.ej. un registro residual con otro role: debe caer al fallback de profiles.
    const db = mockDb({
      administrators: { role: 'moderator' },
      profiles: { role: 'company_admin', company_id: 'co-3' },
      companies: { require_mfa: false },
    })
    const ctx = await service.resolveAdminContext(db, 'u-x')
    expect(ctx.role).toBe('company_admin')
  })
})

describe('identity.otp', () => {
  const otp = require('../../src/modules/identity/identity.otp')

  test('createOTP genera 6 dígitos y validateOTP lo acepta una vez', () => {
    const code = otp.createOTP('admin-1', 'a@x.com')
    expect(code).toMatch(/^\d{6}$/)
    expect(otp.validateOTP('admin-1', code)).toEqual({ valid: true })
    // segundo uso: ya consumido.
    expect(otp.validateOTP('admin-1', code).valid).toBe(false)
  })

  test('código incorrecto → inválido', () => {
    otp.createOTP('admin-2', 'b@x.com')
    expect(otp.validateOTP('admin-2', '000000').valid).toBe(false)
  })
})

describe('identity — migración limpia', () => {
  test('services/otpService.js fue movido (ya no existe)', () => {
    expect(fs.existsSync(path.join(__dirname, '../../src/services/otpService.js'))).toBe(false)
  })

  test('middleware/planContext.js (muerto) fue eliminado', () => {
    expect(fs.existsSync(path.join(__dirname, '../../src/middleware/planContext.js'))).toBe(false)
  })

  test('requireAdmin ya NO tiene SQL inline (delega en identity.service)', () => {
    const src = fs.readFileSync(path.join(__dirname, '../../src/middleware/requireAdmin.js'), 'utf8')
    expect(src).toContain('resolveAdminContext')
    expect(src).not.toContain(".from('administrators')")
    expect(src).not.toContain(".from('profiles')")
  })
})
