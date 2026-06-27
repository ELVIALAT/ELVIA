// Verifica la RPC increment_daily_cap_v2 contra staging (las 3 dimensiones).
require('dotenv').config({ path: __dirname + '/../.env.staging' });
const { createClient } = require('@supabase/supabase-js');

const STAGING_REF = 'evkxbvrbncbtpyvirzee';
if (!process.env.SUPABASE_URL?.includes(STAGING_REF)) {
  console.error('ABORTADO: no es staging.'); process.exit(1);
}
const db = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function main() {
  const today = new Date().toISOString().split('T')[0];
  const fakeUser = '00000000-0000-0000-0000-0000000000aa';
  const fakeCompany = '00000000-0000-0000-0000-0000000000bb';

  // Primera llamada: debe permitir
  const { data: d1, error: e1 } = await db.rpc('increment_daily_cap_v2', {
    p_date: today, p_company_id: fakeCompany, p_user_id: fakeUser,
  });
  if (e1) { console.error('RPC error:', e1.message); process.exit(1); }
  console.log('1ra llamada:', JSON.stringify(d1[0]));
  if (!d1[0].allowed) { console.error('❌ Debió permitir la 1ra'); process.exit(1); }

  // Sin company ni user (caso B2C anónimo): solo dimensión global
  const { data: d2, error: e2 } = await db.rpc('increment_daily_cap_v2', {
    p_date: today, p_company_id: null, p_user_id: null,
  });
  if (e2) { console.error('RPC error (sin scope):', e2.message); process.exit(1); }
  console.log('Sin scope:', JSON.stringify(d2[0]));

  // Limpieza de los contadores de prueba
  await db.from('daily_usage_scoped').delete().in('scope_id', [fakeUser, fakeCompany]);
  console.log('✅ RPC multi-dimensión OK. Contadores de prueba limpiados.');
}
main();
