// Flujo 2: self-signup en el tenant genérico 'publico' (B2C abierto).
const { test, expect } = require('@playwright/test');
const { createClient } = require('@supabase/supabase-js');

test.describe('Flujo 2 — Registro público (tenant genérico)', () => {
  const email = `e2etest.signup.${Date.now()}@example.com`;
  let createdId = null;

  test.afterAll(async () => {
    // Limpiar el usuario recién registrado
    if (!createdId) return;
    const admin = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);
    try { await admin.auth.admin.deleteUser(createdId); } catch { /* best effort */ }
  });

  test('un usuario nuevo puede registrarse en /empresas/publico/registro', async ({ page, request }) => {
    // El registro público pega a POST /api/company/registration/publico.
    // Validamos vía API (la ruta de UI puede variar), que es el contrato real.
    const apiBase = process.env.E2E_API_URL || 'https://elvia-production.up.railway.app';
    const res = await request.post(`${apiBase}/api/company/registration/publico`, {
      data: { email, password: 'E2eSignup123!', nombre: 'Nuevo', apellido: 'Publico' },
    });
    expect(res.status()).toBe(200);
    const body = await res.json();
    expect(body.ok).toBe(true);
    // company_id debe ser el del tenant genérico (nunca null)
    expect(body.user.company_id).toBeTruthy();
    createdId = body.user.id;
  });
});
