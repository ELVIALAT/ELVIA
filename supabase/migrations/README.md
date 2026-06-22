# Migrations — Fuente única de verdad

Consolidado el 2026-06-10 desde 5 fuentes dispersas (Fase 0 del plan maestro):

| Origen | Destino |
|--------|---------|
| `backend/migrations/001..022_*.sql` | `20260101000001..22_*.sql` (mismo número = mismo sufijo) |
| `backend/migrations/008_seed_demo_tenants.sql`, `009_seed_tec_monterrey.sql` | `../seed/` (son datos demo, no schema — resuelve la colisión doble-009) |
| `backend/supabase/migrations/*` (administrators, daily cap RPC) | `20260101000023..25_*.sql` |
| `supabase/migrations/20260503_linkedin_analyses.sql` | `20260503000000_linkedin_analyses.sql` (formato 14 dígitos CLI) |
| `DB_MIGRATION_SQL.sql` (raíz), `scripts/SQL_AUTOMATION.sql`, `scripts/setup_admin.sql` | `docs/audits/legacy-sql/` (archivo histórico, NO aplicar) |

## ⚠️ Advertencias

1. **El orden 023-025 es estimado** — esos 3 archivos no tenían numeración original. Verificar antes de provisionar desde cero.
2. **Esta secuencia NO garantiza un schema completo desde cero**: la auditoría 2026-05-18 documentó que `companies` se define en dos migrations distintas (004 ALTER asume que existe, 007 CREATE IF NOT EXISTS) y que `DB_MIGRATION_SQL.sql` contiene objetos (RPCs como `increment_landing_views`) que no están en ninguna migration numerada.
3. **Para provisionar el stack nuevo (Fase 0-A paso 5)**: el baseline real se genera con `supabase db dump --schema public,auth,storage` contra el proyecto viejo de producción, y se guarda aquí como `<timestamp>_baseline.sql` ANTERIOR a cualquier migration nueva. Las migrations de esta carpeta quedan como referencia histórica del schema.
4. A partir de la consolidación, toda migration nueva se crea con `supabase migration new <nombre>` — nunca SQL suelto en otras carpetas.
