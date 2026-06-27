// Aislamiento del path SERVICE_ROLE (HR / módulo company) contra la BD REAL.
//
// El cliente service_role BYPASEA RLS — el único blindaje del aislamiento HR es que
// el repository (vía tenantQuery) filtre SIEMPRE por companyId. La cobertura previa
// deja un hueco que ESTE test cierra:
//   - tests/modules/tenancy.test.js   → prueba la invariante con un MOCK (la query se
//     construye con company_id), pero un mock no es la BD real.
//   - tests/isolation/multiTenant.test.js → prueba RLS con JWT de usuario REGULAR.
//     Pero el path HR usa service_role, que NO pasa por RLS.
// Aquí ejercitamos el repo REAL + service client contra la BD REAL y verificamos que
// el HR del Tenant A obtiene SOLO datos de A — nunca de B. Es justo el path donde vivió
// el bug histórico de tenantQuery (`.from().eq()` inválido).
//
// Requiere backend/.env.staging (SUPABASE_URL de staging + SUPABASE_SERVICE_ROLE_KEY).
// Correr con: npm run test:isolation   (queda fuera del `npm test` normal).

require('dotenv').config({ path: __dirname + '/../../.env.staging' })
const { createClient } = require('@supabase/supabase-js')
const repo = require('../../src/modules/tenancy/tenancy.repository')
const tenantQuery = require('../../src/lib/tenantQuery')

const URL = process.env.SUPABASE_URL
const SERVICE = process.env.SUPABASE_SERVICE_ROLE_KEY
const STAGING_REF = 'evkxbvrbncbtpyvirzee'

// Guarda: nunca correr contra algo que no sea staging.
const isStaging = URL && URL.includes(STAGING_REF)
const admin = isStaging ? createClient(URL, SERVICE) : null

// Datos de prueba con prefijo identificable para limpieza.
const TAG = 'isotest-svc'
const userA = { email: `${TAG}.userA@example.com`, password: 'IsoSvc123!', id: null }
const userB = { email: `${TAG}.userB@example.com`, password: 'IsoSvc123!', id: null }
const invAEmail = `${TAG}.invA@example.com`
const invBEmail = `${TAG}.invB@example.com`
let companyA, companyB
let allowA, allowB
let invB

async function seedUser(u, companyId) {
  const { data: auth, error } = await admin.auth.admin.createUser({
    email: u.email, password: u.password, email_confirm: true,
  })
  if (error) throw new Error(`createUser falló para ${u.email}: ${error.message}`)
  u.id = auth.user.id
  // El trigger handle_new_user ya creó la fila profiles; upsert añade tenant + role.
  await admin.from('profiles').upsert({ id: u.id, email_principal: u.email, company_id: companyId, role: 'user' })
}

const describeOrSkip = isStaging ? describe : describe.skip

describeOrSkip('Aislamiento service_role (repo real vs BD real)', () => {
  beforeAll(async () => {
    const { data: cA } = await admin.from('companies')
      .insert({ name: `${TAG} Empresa A`, slug: `${TAG}-a`, type: 'corporate' }).select('id').single()
    const { data: cB } = await admin.from('companies')
      .insert({ name: `${TAG} Empresa B`, slug: `${TAG}-b`, type: 'corporate' }).select('id').single()
    companyA = cA.id; companyB = cB.id

    await seedUser(userA, companyA)
    await seedUser(userB, companyB)

    // allowlist en ambos tenants
    const { data: aA } = await admin.from('company_allowlist')
      .insert({ company_id: companyA, email: `${TAG}.alistA@example.com`, status: 'pending' }).select('id').single()
    const { data: aB } = await admin.from('company_allowlist')
      .insert({ company_id: companyB, email: `${TAG}.alistB@example.com`, status: 'pending' }).select('id').single()
    allowA = aA.id; allowB = aB.id

    // invitaciones en ambos tenants (token/status/expires con defaults).
    // Capturamos el id de la de B para probar el borrado cross-tenant.
    await admin.from('company_invitations').insert({ company_id: companyA, email: invAEmail })
    const { data: iB } = await admin.from('company_invitations')
      .insert({ company_id: companyB, email: invBEmail }).select('id').single()
    invB = iB.id

    // Marcadores distintivos para las agregaciones del dashboard/costos.
    // Uso conocido en A (11) y en B (7777) → un leak del dashboard mostraría 7777.
    await admin.from('profiles').update({ usage_count: 11, cv_optimizer_count: 5, cv_match_count: 3 }).eq('id', userA.id)
    await admin.from('profiles').update({ usage_count: 7777, cv_optimizer_count: 333, cv_match_count: 222 }).eq('id', userB.id)
    // Planes y paquetes de mentor con precios marcador (A=1000/500, B=9999/8888).
    await admin.from('company_plans').insert({ company_id: companyA, plan_type: 'pro', duration_months: 3, price_mxn: 1000 })
    await admin.from('company_plans').insert({ company_id: companyB, plan_type: 'max', duration_months: 6, price_mxn: 9999 })
    await admin.from('mentor_packages').insert({ company_id: companyA, hours: 6, price_mxn: 500 })
    await admin.from('mentor_packages').insert({ company_id: companyB, hours: 24, price_mxn: 8888 })
  }, 30000)

  afterAll(async () => {
    if (!admin) return
    await admin.from('company_plans').delete().in('company_id', [companyA, companyB].filter(Boolean))
    await admin.from('mentor_packages').delete().in('company_id', [companyA, companyB].filter(Boolean))
    await admin.from('company_allowlist').delete().in('company_id', [companyA, companyB].filter(Boolean))
    await admin.from('company_invitations').delete().in('company_id', [companyA, companyB].filter(Boolean))
    for (const id of [userA.id, userB.id].filter(Boolean)) {
      await admin.auth.admin.deleteUser(id).catch(() => {})
    }
    await admin.from('companies').delete().in('id', [companyA, companyB].filter(Boolean))
  }, 30000)

  // ── La red de seguridad del helper ──
  test('tenantQuery lanza si falta companyId (imposible una query de tenant sin tenant)', () => {
    expect(() => tenantQuery(admin, null)).toThrow(/companyId/)
  })

  // ── profiles ──
  test('listTenantUsers(A) trae al usuario de A y NUNCA al de B', async () => {
    const rows = await repo.listTenantUsers(admin, companyA)
    const ids = rows.map(r => r.id)
    expect(ids).toContain(userA.id)
    expect(ids).not.toContain(userB.id)
  })

  test('getTenantUserById(A, userB.id) → null (id válido de B, pero invisible para A)', async () => {
    const row = await repo.getTenantUserById(admin, companyA, userB.id)
    expect(row).toBeNull()
  })

  // ── company_allowlist ──
  test('listAllowlist(A) solo trae filas de A', async () => {
    const rows = await repo.listAllowlist(admin, companyA)
    const ids = rows.map(r => r.id)
    expect(ids).toContain(allowA)
    expect(ids).not.toContain(allowB)
  })

  test('getAllowlistById(A, allowB) → null (id de B invisible para A)', async () => {
    const row = await repo.getAllowlistById(admin, companyA, allowB)
    expect(row).toBeNull()
  })

  test('updateAllowlistById(A, allowB, ...) NO modifica la fila de B', async () => {
    // El filtro company_id hace que el update toque 0 filas; el .single() del repo falla.
    await expect(repo.updateAllowlistById(admin, companyA, allowB, { status: 'revoked' })).rejects.toBeTruthy()
    // La fila de B sigue intacta.
    const { data } = await admin.from('company_allowlist').select('status').eq('id', allowB).single()
    expect(data.status).toBe('pending')
  })

  test('deleteAllowlistById(A, allowB) NO borra la fila de B (no-op silencioso)', async () => {
    // A diferencia de update, delete NO usa .single() → borrar un id de otro tenant
    // toca 0 filas y NO lanza. El único blindaje es el .eq('company_id', A) que
    // inyecta tenantQuery. Verificamos contra la BD real que la fila de B sobrevive.
    await expect(repo.deleteAllowlistById(admin, companyA, allowB)).resolves.toBeUndefined()
    const { data } = await admin.from('company_allowlist').select('id').eq('id', allowB).maybeSingle()
    expect(data).not.toBeNull()
    expect(data.id).toBe(allowB)
  })

  // ── company_invitations ──
  test('listInvitations(A) solo trae invitaciones de A', async () => {
    const rows = await repo.listInvitations(admin, companyA)
    const emails = rows.map(r => r.email)
    expect(emails).toContain(invAEmail)
    expect(emails).not.toContain(invBEmail)
  })

  test('getInvitationById(A, invB) → null (id válido de B, invisible para A)', async () => {
    const row = await repo.getInvitationById(admin, companyA, invB)
    expect(row).toBeNull()
  })

  test('deleteInvitationById(A, invB) NO borra la invitación de B (no-op silencioso)', async () => {
    // Igual que delete allowlist: sin .single(), borrar un id de otro tenant no
    // lanza; el filtro company_id de tenantQuery lo deja en 0 filas. La fila de B
    // debe seguir existiendo. (El gate de negocio NO_ACCESS vive en el service vía
    // getInvitationById; aquí probamos el blindaje del repo, su última línea.)
    await expect(repo.deleteInvitationById(admin, companyA, invB)).resolves.toBeUndefined()
    const { data } = await admin.from('company_invitations').select('id').eq('id', invB).maybeSingle()
    expect(data).not.toBeNull()
    expect(data.id).toBe(invB)
  })

  // ── dashboard: agregaciones del tenant (countTenantUsers / getTenantUsageRows) ──
  // No son bugs vivos (ambas pasan por tenantQuery), pero no tenían NINGÚN test de
  // aislamiento: blindan contra una regresión futura que lea profiles sin filtro.
  test('countTenantUsers(A) cuenta solo perfiles de A, nunca los de B', async () => {
    // companyA es fresca (slug único); solo userA está asignado a ella.
    const count = await repo.countTenantUsers(admin, companyA)
    expect(count).toBe(1)
  })

  test('getTenantUsageRows(A) no incluye el uso del perfil de B', async () => {
    const rows = await repo.getTenantUsageRows(admin, companyA)
    const usages = rows.map(r => r.usage_count)
    expect(usages).not.toContain(7777) // marcador sembrado en B
    expect(usages).toContain(11)       // marcador de A (no-vacuo)
  })

  // ── costs: company_plans / mentor_packages del tenant ──
  test('getCompanyPlans(A) solo trae planes de A (nunca el precio marcador de B)', async () => {
    const rows = await repo.getCompanyPlans(admin, companyA)
    const prices = rows.map(r => Number(r.price_mxn))
    expect(prices).not.toContain(9999) // marcador de B
    expect(prices).toContain(1000)     // marcador de A (no-vacuo)
  })

  test('getMentorPackages(A) solo trae paquetes de A (nunca el de B)', async () => {
    const rows = await repo.getMentorPackages(admin, companyA)
    const prices = rows.map(r => Number(r.price_mxn))
    expect(prices).not.toContain(8888) // marcador de B
    expect(prices).toContain(500)      // marcador de A (no-vacuo)
  })
})
