// Crea/actualiza un super_admin en el proyecto Supabase configurado por env.
// Uso: node scripts/create_superadmin_staging.js <email> [password]
// Si no se pasa password, se genera una segura y se imprime una sola vez.
// Lee .env.staging para NUNCA tocar el .env viejo (Telefónica producción).
require('dotenv').config({ path: __dirname + '/../.env.staging' });
const { createClient } = require('@supabase/supabase-js');
const crypto = require('crypto');

const STAGING_REF = 'evkxbvrbncbtpyvirzee';
if (!process.env.SUPABASE_URL || !process.env.SUPABASE_URL.includes(STAGING_REF)) {
  console.error(`ABORTADO: SUPABASE_URL no apunta al staging (${STAGING_REF}).`);
  console.error(`URL actual: ${process.env.SUPABASE_URL || '(vacía)'}`);
  console.error('Verifica backend/.env.staging — este script NO debe correr contra Telefónica.');
  process.exit(1);
}

const supabaseAdmin = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function main() {
  const email = process.argv[2];
  if (!email) {
    console.error('Falta email. Uso: node scripts/create_superadmin_staging.js <email> [password]');
    process.exit(1);
  }
  const nombre = 'Super Admin';
  const password = process.argv[3] || (crypto.randomBytes(12).toString('hex') + 'A1!');

  console.log(`Creando superadmin: ${email}`);

  let userId;
  const { data: { users } } = await supabaseAdmin.auth.admin.listUsers();
  const existing = users.find(u => u.email.toLowerCase() === email.toLowerCase());

  if (existing) {
    console.log('Usuario ya existe en auth — actualizando password...');
    userId = existing.id;
    await supabaseAdmin.auth.admin.updateUserById(userId, { password });
  } else {
    const { data: authUser, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { nombre },
    });
    if (authError) {
      console.error('Error creando usuario en auth:', authError.message);
      process.exit(1);
    }
    userId = authUser.user.id;
  }

  const { error: adminError } = await supabaseAdmin
    .from('administrators')
    .upsert({ id: userId, email, nombre, role: 'super_admin', is_active: true }, { onConflict: 'id' });

  if (adminError) {
    console.error('Error en tabla administrators:', adminError.message);
    process.exit(1);
  }

  console.log('✅ Superadmin listo.');
  console.log(`Email:    ${email}`);
  console.log(`Password: ${password}`);
  console.log('GUARDA ESTA PASSWORD — solo se muestra ahora.');
}

main();
