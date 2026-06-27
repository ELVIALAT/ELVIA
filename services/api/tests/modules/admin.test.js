// Tests del módulo admin (super_admin panel).
// Foco: el wizard de tenants (saga con rollback) y la validación de inputs.
// El repository real usa supabaseAdmin (service_role); aquí lo mockeamos para
// verificar la lógica de negocio sin tocar la red.

const fs = require('fs')
const path = require('path')

// Mock del repository de tenants — inyectado vía jest.mock.
jest.mock('../../src/modules/admin/tenants/tenants.repository')
const repo = require('../../src/modules/admin/tenants/tenants.repository')
const service = require('../../src/modules/admin/tenants/tenants.service')

beforeEach(() => {
  jest.clearAllMocks()
})

describe('tenants.service — checkSlug', () => {
  test('rechaza slug con formato inválido sin tocar DB', async () => {
    const r = await service.checkSlug('Slug Inválido')
    expect(r.available).toBe(false)
    expect(repo.findCompanyBySlug).not.toHaveBeenCalled()
  })

  test('slug válido y libre → available true', async () => {
    repo.findCompanyBySlug.mockResolvedValue(null)
    const r = await service.checkSlug('acme-corp')
    expect(r).toEqual({ available: true, slug: 'acme-corp' })
  })

  test('slug válido pero ocupado → available false', async () => {
    repo.findCompanyBySlug.mockResolvedValue({ id: 'x' })
    const r = await service.checkSlug('acme-corp')
    expect(r.available).toBe(false)
  })
})

describe('tenants.service — patchCompany (whitelist + enums)', () => {
  test('ignora campos fuera de la whitelist y rechaza si no queda nada', async () => {
    await expect(
      service.patchCompany('co1', { hacker_field: 'x', id: 'spoof' }, 'admin1')
    ).rejects.toMatchObject({ code: 'NO_FIELDS' })
    expect(repo.updateCompany).not.toHaveBeenCalled()
  })

  test('branding_mode inválido → INVALID_BRANDING_MODE', async () => {
    await expect(
      service.patchCompany('co1', { branding_mode: 'rainbow' }, 'admin1')
    ).rejects.toMatchObject({ code: 'INVALID_BRANDING_MODE' })
  })

  test('sector inválido → INVALID_SECTOR', async () => {
    await expect(
      service.patchCompany('co1', { sector: 'galactic' }, 'admin1')
    ).rejects.toMatchObject({ code: 'INVALID_SECTOR' })
  })

  test('campos válidos → llama updateCompany solo con esos campos', async () => {
    repo.updateCompany.mockResolvedValue({ id: 'co1', name: 'Nuevo' })
    await service.patchCompany('co1', { name: 'Nuevo', is_active: false, nope: 1 }, 'admin1')
    expect(repo.updateCompany).toHaveBeenCalledWith('co1', { name: 'Nuevo', is_active: false })
  })
})

describe('tenants.service — createTenant (wizard saga)', () => {
  const validBody = {
    nombre: 'Acme', slug: 'acme', hr_nombre: 'Ana', hr_email: 'ana@acme.com',
  }

  test('slug en conflicto → SLUG_CONFLICT, no crea nada', async () => {
    repo.findCompanyBySlug.mockResolvedValue({ id: 'existing' })
    await expect(service.createTenant(validBody, 'admin1')).rejects.toMatchObject({ code: 'SLUG_CONFLICT' })
    expect(repo.insertCompany).not.toHaveBeenCalled()
  })

  test('campos faltantes → MISSING_FIELDS', async () => {
    await expect(service.createTenant({ slug: 'acme' }, 'admin1')).rejects.toMatchObject({ code: 'MISSING_FIELDS' })
  })

  test('feliz: crea empresa → auth user → UPSERT perfil HR (no insert)', async () => {
    repo.findCompanyBySlug.mockResolvedValue(null)
    repo.insertCompany.mockResolvedValue({ id: 'co-new', slug: 'acme' })
    repo.createHrAuthUser.mockResolvedValue({ data: { user: { id: 'hr-new' } }, error: null })
    repo.upsertHrProfile.mockResolvedValue(undefined)
    repo.generateRecoveryLink.mockResolvedValue({ data: { properties: { action_link: 'https://link' } }, error: null })

    const r = await service.createTenant(validBody, 'admin1')

    expect(r.company.id).toBe('co-new')
    expect(r.hr_email).toBe('ana@acme.com')
    // CLAVE: el perfil HR se crea con UPSERT (fix del trigger handle_new_user).
    expect(repo.upsertHrProfile).toHaveBeenCalledTimes(1)
    expect(repo.upsertHrProfile).toHaveBeenCalledWith(
      expect.objectContaining({ id: 'hr-new', company_id: 'co-new', role: 'company_admin' })
    )
  })

  test('si falla el auth user → rollback de la empresa', async () => {
    repo.findCompanyBySlug.mockResolvedValue(null)
    repo.insertCompany.mockResolvedValue({ id: 'co-rb', slug: 'acme' })
    repo.createHrAuthUser.mockResolvedValue({ data: null, error: { message: 'email taken' } })
    repo.deleteCompany.mockResolvedValue() // rollback resuelve (en prod es thenable supabase)

    await expect(service.createTenant(validBody, 'admin1')).rejects.toMatchObject({ code: 'HR_AUTH_FAILED' })
    expect(repo.deleteCompany).toHaveBeenCalledWith('co-rb')
  })

  test('si falla el perfil HR → rollback de auth user Y empresa', async () => {
    repo.findCompanyBySlug.mockResolvedValue(null)
    repo.insertCompany.mockResolvedValue({ id: 'co-rb2', slug: 'acme' })
    repo.createHrAuthUser.mockResolvedValue({ data: { user: { id: 'hr-rb' } }, error: null })
    repo.upsertHrProfile.mockRejectedValue(new Error('profiles_pkey'))
    repo.deleteAuthUser.mockResolvedValue()
    repo.deleteCompany.mockResolvedValue()

    await expect(service.createTenant(validBody, 'admin1')).rejects.toMatchObject({ code: 'HR_PROFILE_FAILED' })
    expect(repo.deleteAuthUser).toHaveBeenCalledWith('hr-rb')
    expect(repo.deleteCompany).toHaveBeenCalledWith('co-rb2')
  })
})

describe('admin — fixes y migración', () => {
  test('routes/admin.js fue eliminado', () => {
    expect(fs.existsSync(path.join(__dirname, '../../src/routes/admin.js'))).toBe(false)
  })

  test('el repository NUNCA hace insert puro en profiles (usa upsert por el trigger)', () => {
    const src = fs.readFileSync(
      path.join(__dirname, '../../src/modules/admin/tenants/tenants.repository.js'), 'utf8'
    )
    // No debe existir un .from('profiles').insert( — solo upsert.
    expect(/\.from\(['"]profiles['"]\)\s*\.insert\(/.test(src)).toBe(false)
    expect(src).toContain("upsert")
  })

  test('admin.knowledge.js no tiene el global implícito insertCount', () => {
    const src = fs.readFileSync(
      path.join(__dirname, '../../src/modules/admin/admin.knowledge.js'), 'utf8'
    )
    // Debe declararse con const/let, no asignación a global implícito.
    expect(/\bconst insertCount\b|\blet insertCount\b/.test(src)).toBe(true)
    expect(/^\s*insertCount\s*=/m.test(src)).toBe(false)
  })
})
