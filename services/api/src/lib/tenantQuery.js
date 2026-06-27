// tenantQuery — helper para queries SIEMPRE filtradas por company_id.
// Evita el patrón propenso a errores de olvidar .eq('company_id', companyId)
// y, como el módulo tenancy usa service_role (bypasea RLS), es la red de
// seguridad del aislamiento multi-tenant.
//
// API:
//   const tq = tenantQuery(db, req.companyId)
//
//   // SELECT / UPDATE / DELETE — el filtro company_id se aplica DESPUÉS del
//   // verbo (así lo exige el query builder de supabase-js: .eq() solo existe
//   // tras .select()/.update()/.delete(), nunca directamente sobre .from()).
//   await tq('profiles').select('id, email_principal')
//   await tq('profiles').select('*', { count: 'exact', head: true })
//   await tq('profiles').update({ suspended: true }).eq('id', userId)
//   await tq('company_allowlist').delete().eq('id', id)
//
//   // INSERT / UPSERT — company_id auto-inyectado en cada row.
//   await tq.insert('cv_results', { user_id, contenido, tipo })
//   await tq.upsert('company_allowlist', { email, nombre, status }, { onConflict: 'company_id,email' })
//
// Para tablas SIN company_id (companies, auth.users), usar db directamente.

const tenantQuery = (db, companyId) => {
  if (!companyId) {
    throw new Error('tenantQuery: companyId es requerido')
  }

  // tq(table) → objeto cuyos verbos aplican .eq('company_id', companyId) tras
  // el verbo. Devolver el filter builder permite seguir encadenando
  // (.eq('id', x), .order(), .single(), .select() tras update, etc.).
  const builder = (table) => {
    const from = db.from(table)
    return {
      // SELECT — soporta opciones (p.ej. { count, head }).
      select: (columns = '*', options) =>
        from.select(columns, options).eq('company_id', companyId),
      // UPDATE — el filtro company_id impide tocar filas de otro tenant.
      update: (values) => from.update(values).eq('company_id', companyId),
      // DELETE — idem: solo borra dentro del tenant.
      delete: () => from.delete().eq('company_id', companyId),
    }
  }

  // INSERT/UPSERT: inyectar company_id en cada row (no se filtra, se estampa).
  builder.insert = (table, rows) => {
    const arr = Array.isArray(rows) ? rows : [rows]
    const stamped = arr.map(r => ({ ...r, company_id: companyId }))
    return db.from(table).insert(stamped)
  }

  builder.upsert = (table, rows, opts) => {
    const arr = Array.isArray(rows) ? rows : [rows]
    const stamped = arr.map(r => ({ ...r, company_id: companyId }))
    return db.from(table).upsert(stamped, opts)
  }

  return builder
}

module.exports = tenantQuery
