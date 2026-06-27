// Borra un usuario de prueba del staging por email. Uso: node scripts/delete_test_user_staging.js <email>
require('dotenv').config({ path: __dirname + '/../.env.staging' });
const { createClient } = require('@supabase/supabase-js');

const STAGING_REF = 'evkxbvrbncbtpyvirzee';
if (!process.env.SUPABASE_URL || !process.env.SUPABASE_URL.includes(STAGING_REF)) {
  console.error(`ABORTADO: SUPABASE_URL no apunta al staging (${STAGING_REF}).`);
  process.exit(1);
}

const supabaseAdmin = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function main() {
  const email = process.argv[2];
  if (!email) { console.error('Falta email.'); process.exit(1); }
  const { data: { users } } = await supabaseAdmin.auth.admin.listUsers();
  const u = users.find(x => x.email.toLowerCase() === email.toLowerCase());
  if (!u) { console.log('No existe ese usuario.'); return; }
  await supabaseAdmin.auth.admin.deleteUser(u.id);
  console.log(`✅ Borrado: ${email} (${u.id})`);
}
main();
