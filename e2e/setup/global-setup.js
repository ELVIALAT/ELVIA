// Global setup: crea tenants + usuarios de prueba en staging vía service_role.
// Guarda los IDs en un archivo temporal para que el teardown los limpie.
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: __dirname + '/../.env' });
const { fixtures } = require('./fixtures');

const STAGING_REF = 'evkxbvrbncbtpyvirzee';
const STATE_FILE = path.join(__dirname, '.e2e-state.json');

module.exports = async () => {
  const URL = process.env.SUPABASE_URL;
  const SERVICE = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!URL || !URL.includes(STAGING_REF) || !SERVICE) {
    throw new Error('E2E: faltan SUPABASE_URL (staging) / SUPABASE_SERVICE_ROLE_KEY en e2e/.env');
  }

  const admin = createClient(URL, SERVICE);

  // Tenants
  const { data: cA } = await admin.from('companies')
    .upsert({ name: fixtures.companyA.name, slug: fixtures.companyA.slug, type: 'corporate', is_active: true }, { onConflict: 'slug' })
    .select('id').single();
  const { data: cB } = await admin.from('companies')
    .upsert({ name: fixtures.companyB.name, slug: fixtures.companyB.slug, type: 'corporate', is_active: true }, { onConflict: 'slug' })
    .select('id').single();
  fixtures.companyA.id = cA.id;
  fixtures.companyB.id = cB.id;

  // Helper para crear usuario + profile
  async function ensureUser(u, { companyId = null, role = 'user' } = {}) {
    const { data: list } = await admin.auth.admin.listUsers();
    const existing = list.users.find(x => x.email.toLowerCase() === u.email.toLowerCase());
    if (existing) {
      u.id = existing.id;
      await admin.auth.admin.updateUserById(u.id, { password: u.password, email_confirm: true });
    } else {
      const { data } = await admin.auth.admin.createUser({ email: u.email, password: u.password, email_confirm: true });
      u.id = data.user.id;
    }
    await admin.from('profiles').upsert({
      id: u.id, email_principal: u.email, nombre1: u.nombre, apellido1: u.apellido,
      company_id: companyId, role,
    });
  }

  await ensureUser(fixtures.candidato, { companyId: null, role: 'user' });
  await ensureUser(fixtures.hrA, { companyId: fixtures.companyA.id, role: 'company_admin' });
  await ensureUser(fixtures.colabB, { companyId: fixtures.companyB.id, role: 'user' });

  // Persistir estado para teardown
  fs.writeFileSync(STATE_FILE, JSON.stringify({
    companies: [fixtures.companyA.id, fixtures.companyB.id],
    users: [fixtures.candidato.id, fixtures.hrA.id, fixtures.colabB.id],
  }, null, 2));

  console.log('[E2E setup] tenants + usuarios de prueba listos.');
};
