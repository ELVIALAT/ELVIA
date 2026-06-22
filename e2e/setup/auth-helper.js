// Helper de login vía UI para los tests E2E.
// El formulario de login está en /auth (Auth.jsx): inputs por type, sin testid.

async function login(page, email, password) {
  await page.goto('/auth');
  // Esperar el formulario de login
  await page.waitForSelector('input[type="email"]', { timeout: 15000 });
  await page.fill('input[type="email"]', email);
  await page.fill('input[type="password"]', password);
  await page.click('button[type="submit"]');
  // Tras login exitoso, la app redirige fuera de /auth (a /bienvenida o /dashboard)
  await page.waitForURL(url => !url.pathname.startsWith('/auth'), { timeout: 20000 });
}

module.exports = { login };
