# Auditoría de service_role (supabaseAdmin) — Deuda #3

> Auditoría read-only de todos los usos de `supabaseAdmin` (service_role, bypasea RLS)
> para detectar fugas cross-tenant. Medido el **2026-07-01** sobre `dev2`. Hermano de [`AI_LAYER_MAPPING.md`](AI_LAYER_MAPPING.md).

## Conclusión ejecutiva

**No hay violaciones de aislamiento cross-tenant.** Los ~53 usos de `supabaseAdmin` en 15 archivos
son TODOS legítimos: repositorio de super_admin, tablas globales (audit, RAG, waitlist B2C, ai_usage),
API auth-admin, rate-limit y cron batch. **No se requiere remediación de seguridad.**

El hallazgo clave: **el acceso a datos TENANT-SCOPED (HR/company_admin gestionando sus candidatos)
NO usa `supabaseAdmin`** — usa clientes con RLS (`modules/tenancy`, `req.supabase`). service_role está
confinado a operaciones donde el cross-tenant es intencional (super_admin) o donde no hay tenant (tablas globales).
No existe ningún path donde un no-super_admin alcance datos de otro tenant vía una query service_role sin guard.

## Criterio de clasificación

- **VIOLACIÓN** = query tenant-scoped vía service_role SIN filtro `company_id`, alcanzable por un rol
  no-super_admin → fuga potencial. **Encontradas: 0.**
- **LEGIT_REPO** = repositorio que encapsula acceso de super_admin (cross-tenant por diseño, gated).
- **LEGIT_GLOBAL** = tabla/operación sin dimensión de tenant (audit, RAG, waitlist, telemetría, auth-admin, cron, rate-limit).
- **LEGIT_CLIENT_DEF** = definición del cliente.

## Clasificación por archivo

| Archivo | Usos | Veredicto | Por qué |
|---|---|---|---|
| `modules/admin/tenants/tenants.repository.js` | 14 | LEGIT_REPO | CRUD de companies del super_admin; único punto Supabase; todas las rutas `requireRole('super_admin')`. |
| `routes/waitlist.js` | 8 | LEGIT_GLOBAL | `waitlist_leads` es B2C pre-tenant (sin company_id). Ver nota #1. |
| `modules/admin/admin.users.js` | 6 | LEGIT_GLOBAL | super_admin: borrado GDPR (`auth.admin`) + `deletion_audit_log`. Su propio perfil lo lee con `req.supabase` (RLS). |
| `controllers/cronController.js` | 6 | LEGIT_GLOBAL | Cron (CRON_SECRET), batch de emails; scopea candidatos con `.eq('company_id', ...)` por empresa. |
| `platform/ai/cost/ledger.js` | 5 | LEGIT_GLOBAL | Escribe `ai_usage` (tabla RLS-deny = solo service_role). Telemetría de costo. |
| `modules/admin/tenants/tenants.service.js` | 4 | LEGIT_GLOBAL | Solo `logAudit(supabaseAdmin, …)`; los datos van por `repo.*`. |
| `modules/admin/admin.knowledge.js` | 4 | LEGIT_GLOBAL | super_admin; `elvia_knowledge`/`knowledge_logs` = RAG global (sin tenant). |
| `modules/admin/admin.aiCost.js` | 4 | LEGIT_GLOBAL | super_admin dashboard; RPC `ai_usage_summary` sobre tabla RLS-deny. |
| `middleware/dailyCap.js` | 4 | LEGIT_GLOBAL | RPC `increment_daily_cap_v2` (rate-limit 3-dim) + perfil propio del caller. |
| `services/knowledgeBaseService.js` | 3 | LEGIT_GLOBAL | Full-text search sobre `elvia_knowledge` (RAG global). |
| `middleware/auditAdmin.js` | 3 | LEGIT_GLOBAL | Escribe `admin_audit_log` (auditoría global). |
| `routes/email.js` | 2 | LEGIT_GLOBAL | `auth.admin.generateLink` (recovery); sin datos de tenant; anti-phishing por whitelist. |
| `modules/admin/admin.audit.js` | 2 | LEGIT_GLOBAL | super_admin lee `tenant_audit_log` (filtro `company_id` opcional). |
| `lib/supabase.js` | 2 | LEGIT_CLIENT_DEF | Definición/export del cliente. |
| `lib/logAudit.js` | 1 | LEGIT_GLOBAL | Writer de `tenant_audit_log` (company_id lo provee la op super_admin). |

## Observaciones menores (NO seguridad — opcionales)

1. ✅ **HECHO** — `waitlist.js` GET `/` migrado de un check ad-hoc `is_admin` a `requireRole('super_admin')`
   (gate canónico = tabla `administrators`, consistente con el resto de admin.*). Bonus: elimina 1 uso de
   `supabaseAdmin`. Los super_admin reales no se afectan (ya autentican vía `administrators` en el Admin panel).
2. **Consistencia arquitectónica:** algunas lecturas/escrituras de tablas globales viven directo en routes/
   controllers en vez de en un pequeño repository. Es preferencia de estilo, no seguridad: el patrón repository
   importa para acceso TENANT-SCOPED (para forzar el guard), y esas rutas ya usan RLS. *Fix opcional, baja prioridad.*

## Por qué el aislamiento se sostiene

- RLS "strict" (migración `rls_multitenant_strict`) aísla a clientes normales por `company_id`.
- Los paths de company_admin (gestión de candidatos) usan `req.supabase`/`tenantQuery` (RLS), nunca service_role.
- service_role solo aparece tras `requireRole('super_admin')`, `CRON_SECRET`, o sobre tablas sin tenant.
- Red de tests de aislamiento (Fase 1, 4 capas) cubre RLS-jwt, service_role-repo, E2E-live y unit.

## Recomendación

**#3 cerrado sin cambios de seguridad** (no había exposición cross-tenant). Se aplicó el pulido opcional #1
(waitlist → `requireRole('super_admin')`, verificado: 137/137). La nota #2 queda pendiente como estilo, baja prioridad.
