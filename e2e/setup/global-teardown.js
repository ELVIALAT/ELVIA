// Global teardown: borra todos los datos de prueba creados en el setup.
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: __dirname + '/../.env' });

const STATE_FILE = path.join(__dirname, '.e2e-state.json');

module.exports = async () => {
  if (!fs.existsSync(STATE_FILE)) return;
  const state = JSON.parse(fs.readFileSync(STATE_FILE, 'utf8'));
  const admin = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

  const tryDo = async (fn) => { try { await fn(); } catch { /* limpieza best-effort */ } };

  // Borrar datos dependientes primero
  for (const uid of state.users || []) {
    await tryDo(() => admin.from('cv_results').delete().eq('user_id', uid));
    await tryDo(() => admin.from('saved_jobs').delete().eq('user_id', uid));
    await tryDo(() => admin.auth.admin.deleteUser(uid));
  }
  for (const cid of state.companies || []) {
    await tryDo(() => admin.from('companies').delete().eq('id', cid));
  }

  fs.unlinkSync(STATE_FILE);
  console.log('[E2E teardown] datos de prueba limpiados.');
};
