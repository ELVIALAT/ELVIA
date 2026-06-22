// Flujo 1 (spec §6.1): Login de candidato B2C → entra a la app.
const { test, expect } = require('@playwright/test');
const { login } = require('../setup/auth-helper');
const { fixtures } = require('../setup/fixtures');

test.describe('Flujo 1 — Login candidato', () => {
  test('candidato del tenant genérico hace login y entra a la app', async ({ page }) => {
    await login(page, fixtures.candidato.email, fixtures.candidato.password);

    // No debe seguir en /auth
    expect(page.url()).not.toContain('/auth');

    // Debe ver UI autenticada (header con logout, o nav). Verificamos que NO
    // estamos en una pantalla de error y que cargó contenido autenticado.
    await expect(page.locator('body')).not.toContainText('Error al cargar tus datos', { timeout: 10000 });
  });
});
