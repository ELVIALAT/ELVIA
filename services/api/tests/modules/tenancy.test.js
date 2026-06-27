// Tests del módulo tenancy (company B2B).
// Foco P0: el aislamiento multi-tenant. El repository usa service_role (bypasea
// RLS), así que el ÚNICO blindaje es que TODA query de tenant filtre por
// companyId. Aquí verificamos esa invariante de forma determinista.

const repo = require('../../src/modules/tenancy/tenancy.repository')
const service = require('../../src/modules/tenancy/tenancy.service')
const fs = require('fs')
const path = require('path')

// ── Mock del query builder de Supabase ──
// Captura la tabla y la cadena de filtros aplicados para poder afirmar que
// company_id SIEMPRE está presente en operaciones de tenant.
// Mock fiel a supabase-js: .from(table) devuelve un objeto SOLO con verbos
// (select/insert/update/upsert/delete) y NUNCA con .eq() directo. El filter
// builder (con .eq/.order/.ilike/.gt/.single...) aparece ÚNICAMENTE tras un verbo.
// Así, si el código vuelve a hacer .from().eq() (el bug del helper viejo), el
// mock falla con "eq is not a function", igual que Supabase real.
function mockDb(rowsByTable = {}) {
  const calls = []
  const make = (table) => {
    const applied = { table, filters: {}, op: 'select', inserted: null }
    calls.push(applied)
    // Filter builder: lo que devuelve cada verbo. Thenable + terminadores.
    const filter = {
      eq(col, val) { applied.filters[col] = val; return filter },
      ilike(col, val) { applied.filters[col] = val; return filter },
      gt(col, val) { applied.filters[`${col}>`] = val; return filter },
      order() { return filter },
      limit() { return filter },
      select() { return filter }, // .update(...).select() encadenado
      maybeSingle: async () => ({ data: rowsByTable[table] ?? null, error: null }),
      single: async () => (rowsByTable[table]
        ? { data: rowsByTable[table], error: null }
        : { data: null, error: { message: 'no rows' } }),
      then(resolve) { return resolve({ data: rowsByTable[table] ?? [], error: null, count: rowsByTable[`${table}__count`] ?? 0 }) },
    }
    // Objeto base de .from(): SOLO verbos, sin .eq directo.
    return {
      select() { applied.op = 'select'; return filter },
      update(data) { applied.op = 'update'; applied.updated = data; return filter },
      delete() { applied.op = 'delete'; return filter },
      insert(rows) { applied.op = 'insert'; applied.inserted = rows; return filter },
      upsert(rows, opts) { applied.op = 'upsert'; applied.inserted = rows; applied.opts = opts; return filter },
    }
  }
  return { db: { from: make }, calls }
}

const COMPANY_A = 'company-aaaa'

describe('tenancy.repository — aislamiento (companyId obligatorio)', () => {
  test('listTenantUsers filtra SIEMPRE por company_id', async () => {
    const { db, calls } = mockDb({ profiles: [] })
    await repo.listTenantUsers(db, COMPANY_A)
    const call = calls.find(c => c.table === 'profiles')
    expect(call.filters.company_id).toBe(COMPANY_A)
  })

  test('getTenantUserById filtra por company_id (no solo por id)', async () => {
    const { db, calls } = mockDb({ profiles: { company_id: COMPANY_A } })
    await repo.getTenantUserById(db, COMPANY_A, 'user-x')
    const call = calls.find(c => c.table === 'profiles')
    expect(call.filters.company_id).toBe(COMPANY_A)
    expect(call.filters.id).toBe('user-x')
  })

  test('updateTenantUser aplica company_id + id (no puede tocar otro tenant)', async () => {
    const { db, calls } = mockDb({ profiles: { id: 'u1' } })
    await repo.updateTenantUser(db, COMPANY_A, 'u1', { suspended: true })
    const call = calls.find(c => c.table === 'profiles')
    expect(call.op).toBe('update')
    expect(call.filters.company_id).toBe(COMPANY_A)
    expect(call.filters.id).toBe('u1')
  })

  test('bulkUpsertAllowlist inyecta company_id en CADA fila', async () => {
    const { db, calls } = mockDb({ company_allowlist: [] })
    await repo.bulkUpsertAllowlist(db, COMPANY_A, [
      { email: 'a@x.com' }, { email: 'b@x.com' },
    ])
    const call = calls.find(c => c.table === 'company_allowlist')
    expect(call.inserted.every(r => r.company_id === COMPANY_A)).toBe(true)
  })

  test('upsertTenantProfile inyecta company_id', async () => {
    const { db, calls } = mockDb({ profiles: { id: 'u1', company_id: COMPANY_A } })
    await repo.upsertTenantProfile(db, COMPANY_A, { id: 'u1', email_principal: 'u@x.com' })
    const call = calls.find(c => c.table === 'profiles')
    expect(call.inserted[0].company_id).toBe(COMPANY_A)
  })
})

describe('tenancy.repository — companyId faltante es IMPOSIBLE (tenantQuery lanza)', () => {
  const TENANT_FNS = [
    ['listTenantUsers', (db) => repo.listTenantUsers(db, undefined)],
    ['getTenantUserById', (db) => repo.getTenantUserById(db, undefined, 'u1')],
    ['updateTenantUser', (db) => repo.updateTenantUser(db, null, 'u1', {})],
    ['listAllowlist', (db) => repo.listAllowlist(db, undefined)],
    ['getAllowlistByEmail', (db) => repo.getAllowlistByEmail(db, '', 'a@x.com')],
    ['bulkUpsertAllowlist', (db) => repo.bulkUpsertAllowlist(db, undefined, [{ email: 'a@x.com' }])],
    ['listInvitations', (db) => repo.listInvitations(db, null)],
    ['getCompanyPlans', (db) => repo.getCompanyPlans(db, undefined)],
    ['getMentorPackages', (db) => repo.getMentorPackages(db, null)],
    ['countTenantUsers', (db) => repo.countTenantUsers(db, undefined)],
  ]

  test.each(TENANT_FNS)('%s sin companyId lanza (no devuelve datos cross-tenant)', async (_name, fn) => {
    const { db } = mockDb({})
    await expect(fn(db)).rejects.toThrow(/companyId/i)
  })
})

describe('tenancy.service — pre-flights de seguridad', () => {
  test('updateUser con plan inválido lanza INVALID_PLAN', async () => {
    const { db } = mockDb({ profiles: { company_id: COMPANY_A, plan: 'pro' } })
    await expect(
      service.updateUser(db, COMPANY_A, 'actor', 'u1', { plan: 'hacker' })
    ).rejects.toMatchObject({ code: 'INVALID_PLAN' })
  })

  test('updateUser sobre usuario de OTRO tenant lanza NO_ACCESS', async () => {
    // getTenantUserById devuelve null porque el filtro de company_id no matchea.
    const { db } = mockDb({})
    await expect(
      service.updateUser(db, COMPANY_A, 'actor', 'u-de-otra-empresa', { nombre: 'x' })
    ).rejects.toMatchObject({ code: 'NO_ACCESS' })
  })

  test('deleteAllowlist de entrada activada lanza CANNOT_DELETE_ACTIVATED', async () => {
    const { db } = mockDb({ company_allowlist: { id: 'a1', company_id: COMPANY_A, status: 'activated' } })
    await expect(
      service.deleteAllowlist(db, COMPANY_A, 'a1')
    ).rejects.toMatchObject({ code: 'CANNOT_DELETE_ACTIVATED' })
  })
})

describe('tenancy — la ruta vieja routes/company.js fue eliminada', () => {
  test('src/routes/company.js ya no existe', () => {
    const p = path.join(__dirname, '../../src/routes/company.js')
    expect(fs.existsSync(p)).toBe(false)
  })
})
