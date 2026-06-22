// Flujo 5 / §6.2: aislamiento del HR.
// El HR (company_admin) de Empresa A NO debe poder ver datos de Empresa B.
// Se valida a nivel de API con el JWT real del HR (lo que el frontend usa).
const { test, expect } = require('@playwright/test');
const { createClient } = require('@supabase/supabase-js');
const { fixtures } = require('../setup/fixtures');

const apiBase = process.env.E2E_API_URL || 'https://elvia-production.up.railway.app';

async function hrToken() {
  const cli = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_ANON_KEY);
  const { data, error } = await cli.auth.signInWithPassword({
    email: fixtures.hrA.email, password: fixtures.hrA.password,
  });
  if (error) throw new Error(`Login HR falló: ${error.message}`);
  return data.session.access_token;
}

test.describe('Flujo 5 — Aislamiento del HR (company_admin)', () => {
  test('HR de A obtiene SU tenant (no el de B) en /api/company/my-tenant', async ({ request }) => {
    const token = await hrToken();
    const res = await request.get(`${apiBase}/api/company/my-tenant`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    expect(res.status()).toBe(200);
    const body = await res.json();
    // El tenant devuelto debe ser Empresa A, nunca B.
    const slug = body?.company?.slug || body?.slug;
    expect(slug).toBe(fixtures.companyA.slug);
    expect(slug).not.toBe(fixtures.companyB.slug);
  });

  test('el JWT del HR de A no contiene company_id de B (defensa anti-spoof)', async () => {
    const token = await hrToken();
    // Decodificar el payload del JWT (sin verificar firma, solo inspección)
    const payload = JSON.parse(Buffer.from(token.split('.')[1], 'base64').toString());
    // El JWT de Supabase no debe portar company_id manipulable; el backend lo
    // resuelve del profile. Verificamos que no haya un company_id de B inyectado.
    expect(JSON.stringify(payload)).not.toContain(fixtures.companyB.id || '___nope___');
  });
});
