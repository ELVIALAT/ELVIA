// Flujo 5 / §6.2: aislamiento del HR (company_admin).
// El HR de Empresa A NO debe poder ver NI tocar datos de Empresa B.
//
// Se valida contra la API EN VIVO con el JWT real del HR — exactamente lo que el
// frontend usa. Esto cierra el hueco entre "el repository filtra bien por
// companyId" (cubierto a nivel unit en services/api/tests/isolation/) y "el
// companyId que recibe el repository es el correcto e inspoofeable", que solo se
// prueba recorriendo toda la cadena HTTP: auth → requireRole (resuelve companyId
// server-side desde el user.id, no de input del cliente) → requireTenantContext
// → requireMFA → controller → service → repository.
//
// Nota sobre MFA: las empresas de prueba se crean sin require_mfa, así que
// requireMFA es un no-op y la cadena llega al filtro de tenant real. Si alguna
// ruta devolviera 403 MFA_REQUIRED, el assert de status 200 fallaría de forma
// visible (no enmascara el aislamiento — sería un hallazgo distinto a documentar).
const { test, expect } = require('@playwright/test');
const { createClient } = require('@supabase/supabase-js');
const { fixtures } = require('../setup/fixtures');

const apiBase = process.env.E2E_API_URL || 'https://elvia-production.up.railway.app';

// Obtiene un access_token real iniciando sesión con anon key (como el navegador).
async function tokenFor(user) {
  const cli = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_ANON_KEY);
  const { data, error } = await cli.auth.signInWithPassword({
    email: user.email, password: user.password,
  });
  if (error) throw new Error(`Login falló para ${user.email}: ${error.message}`);
  return data.session.access_token;
}

const hrToken = () => tokenFor(fixtures.hrA);

test.describe('Flujo 5 — Aislamiento del HR (company_admin)', () => {
  test('HR de A obtiene SU tenant (no el de B) en /api/company/my-tenant', async ({ request }) => {
    const token = await hrToken();
    const res = await request.get(`${apiBase}/api/company/my-tenant`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    expect(res.status()).toBe(200);
    const body = await res.json();
    const slug = body?.company?.slug || body?.slug;
    expect(slug).toBe(fixtures.companyA.slug);
    expect(slug).not.toBe(fixtures.companyB.slug);
  });

  test('el JWT del HR de A no contiene company_id de B (defensa anti-spoof)', async () => {
    const token = await hrToken();
    const payload = JSON.parse(Buffer.from(token.split('.')[1], 'base64').toString());
    expect(JSON.stringify(payload)).not.toContain(fixtures.companyB.id || '___nope___');
  });

  // ── El ataque central: HR de A no puede LEER usuarios de B ──────────────────
  // GET /api/company/users es la mayor superficie de fuga de PII (emails, nombres,
  // plan, suspended de toda otra empresa). Es el endpoint que define el aislamiento.
  test('GET /api/company/users: HR de A solo ve usuarios de SU tenant (nunca colabB)', async ({ request }) => {
    const token = await hrToken();
    const res = await request.get(`${apiBase}/api/company/users`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    expect(res.status()).toBe(200);
    const body = await res.json();
    const users = body.users || [];

    const ids = users.map(u => u.id);
    const emails = users.map(u => (u.email_principal || '').toLowerCase());

    // Negativo (lo crítico): colabB pertenece a B → JAMÁS debe aparecer.
    expect(ids).not.toContain(fixtures.colabB.id);
    expect(emails).not.toContain(fixtures.colabB.email.toLowerCase());

    // Positivo (no-vacuo): el propio HR de A SÍ está en la lista de A.
    expect(ids).toContain(fixtures.hrA.id);
  });

  // ── HR de A no puede LEER el perfil de empresa de B ─────────────────────────
  // GET /api/company/profile resuelve la empresa vía requireRole → req.companyId
  // (cadena distinta a /my-tenant, que va por getOwnProfile). Cubre que esa
  // resolución server-side devuelve A y nunca B.
  test('GET /api/company/profile: HR de A obtiene la empresa A, nunca la B', async ({ request }) => {
    const token = await hrToken();
    const res = await request.get(`${apiBase}/api/company/profile`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    expect(res.status()).toBe(200);
    const body = await res.json();
    const company = body.company || body;
    expect(company.id).toBe(fixtures.companyA.id);
    expect(company.id).not.toBe(fixtures.companyB.id);
    expect(company.slug).toBe(fixtures.companyA.slug);
  });

  // ── HR de A no puede LEER el allowlist de B ─────────────────────────────────
  // El setup siembra una entrada de allowlist marcada en B (allowlistB) y otra en
  // A (allowlistA). El assert es no-vacuo en ambos sentidos: la de A debe verse,
  // la de B nunca. (listAllowlist no devuelve company_id, por eso usamos emails
  // marcados en vez de comparar el tenant de cada fila.)
  test('GET /api/company/allowlist: HR de A no ve entradas de allowlist de B', async ({ request }) => {
    const token = await hrToken();
    const res = await request.get(`${apiBase}/api/company/allowlist`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    expect(res.status()).toBe(200);
    const body = await res.json();
    const emails = (body.allowlist || []).map(a => (a.email || '').toLowerCase());

    // Negativo: el marcador sembrado en B JAMÁS aparece para A.
    expect(emails).not.toContain(fixtures.allowlistB.email.toLowerCase());
    // Positivo (no-vacuo): el marcador de A SÍ aparece.
    expect(emails).toContain(fixtures.allowlistA.email.toLowerCase());
  });

  // ── Compuerta de rol: un usuario regular no puede usar rutas HR ─────────────
  // colabB es role 'user' (no company_admin). requireRole('company_admin') debe
  // rechazarlo con 403 antes de tocar dato alguno.
  test('GET /api/company/users: un usuario regular (colabB) recibe 403', async ({ request }) => {
    const token = await tokenFor(fixtures.colabB);
    const res = await request.get(`${apiBase}/api/company/users`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    expect(res.status()).toBe(403);
  });
});
