// tenancy.client — encapsula el cliente Supabase con SERVICE_ROLE para el
// módulo company/tenancy.
//
// ⚠️  POR QUÉ SERVICE_ROLE (y el riesgo que conlleva):
// El HR (company_admin) necesita ver agregados de TODA su empresa (todos los
// perfiles, allowlist, invitaciones del tenant). La RLS "dueño de fila" no lo
// permite: un HR no es dueño de las filas de sus colaboradores. Por eso este
// módulo usa un cliente service_role que BYPASEA RLS.
//
// CONSECUENCIA CRÍTICA: como no hay RLS de respaldo, el aislamiento multi-tenant
// depende 100% de que CADA query filtre explícitamente por company_id. Ese
// filtrado vive en tenancy.repository.js (vía el helper tenantQuery, que exige
// companyId). NUNCA usar este cliente para datos de tenant sin pasar por el
// repository.
//
// Degrada con gracia: si faltan las envs, devuelve null y las rutas que
// dependen de DB responden 503 en runtime en vez de crashear al boot.

const { createClient } = require('@supabase/supabase-js')

let client = null

if (!process.env.SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
  console.error('[Tenancy] SUPABASE_URL o SUPABASE_SERVICE_ROLE_KEY no configuradas — endpoints B2B deshabilitados')
} else {
  try {
    client = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY)
  } catch (err) {
    console.error('[Tenancy] Error inicializando supabase admin client:', err.message)
  }
}

// getClient() — devuelve el singleton service_role (o null si no está configurado).
const getClient = () => client

module.exports = { getClient }
