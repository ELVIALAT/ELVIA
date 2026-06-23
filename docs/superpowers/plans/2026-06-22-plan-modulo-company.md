# Plan de migración — Módulo `tenancy/company` (Fase 2)

**Fecha:** 2026-06-22 (preparado para ejecutar en sesión fresca).
**Riesgo:** ALTO — el plan maestro lo marca como el módulo más delicado. Ejecutar con cuidado y verificar aislamiento con los tests E2E/isolation antes de mergear.

## Por qué es el más sensible

`backend/src/routes/company.js` (1310 LOC, 21 rutas) usa **un cliente `db` con SERVICE_ROLE global** (línea ~41: `db = createClient(URL, SERVICE_ROLE_KEY)`) para TODAS sus queries. Razón legítima: el HR (`company_admin`) necesita ver agregados de SU empresa, lo que la RLS "dueño de fila" no permite.

**Consecuencia crítica:** como el cliente bypasea RLS, **el aislamiento multi-tenant depende 100% de que CADA query filtre explícitamente por `company_id`**. No hay RLS de respaldo. Si una query olvida `.eq('company_id', req.companyId)`, el HR de empresa A ve datos de empresa B. **Este es el corazón del riesgo.**

## Cómo se obtiene el tenant
- `requireRole('company_admin')` → pone `req.companyId`.
- `requireTenantContext` → 400 si falta `req.companyId`.
- `requireMFA` → exige MFA.
- Cadena típica: `auth, requireRole('company_admin'), requireTenantContext, requireMFA, handler`.

## Rutas (21) y tablas
Tablas: `profiles` (16 queries), `company_allowlist` (12), `companies` (8), `company_invitations` (6), `deletion_audit_log` (3), `company_plans` (2), `mentor_packages` (1).

Públicas (sin auth): `GET /registration/:slug`, `GET /branding/:slug`, `POST /registration/:slug` (rate-limited).
Autenticadas usuario: `GET /my-tenant`, `POST /confirm-activation`.
HR (company_admin + tenant + MFA): users (GET/POST/PATCH/DELETE), invitations (GET/POST/DELETE), profile (GET/PATCH), dashboard, costs (GET + export), allowlist (GET/POST bulk/PATCH/DELETE).

## Diseño del módulo `src/modules/tenancy/`

1. **`tenancy.client.js`** — encapsula el cliente service_role (hoy inline). Singleton, degrada si faltan envs.

2. **`tenancy.repository.js`** — ÚNICA capa que toca Supabase. **REGLA DE ORO REFORZADA:** TODA función que opere sobre datos de un tenant DEBE recibir `companyId` como parámetro OBLIGATORIO y filtrar por él. Firma tipo: `listUsers(companyId)`, `createUser(companyId, data)`, `getAllowlist(companyId)`, etc. Las funciones públicas (branding/registration por slug) van aparte y claramente marcadas como sin-tenant-context.

3. **`tenancy.service.js`** — lógica de negocio (invitaciones con token, activación, agregados de dashboard/costs, validación de allowlist). Errores de dominio con `code`.

4. **`tenancy.controller.js`** — HTTP. Pasa `req.companyId` al service/repository SIEMPRE.

5. **`tenancy.schemas.js`** — Zod. Mover `companyRegistration` y `allowlistBulk` del schema central aquí.

6. **`tenancy.routes.js`** — wiring. Conservar EXACTAMENTE la cadena de middlewares de cada ruta (auth/role/tenant/MFA) — no relajar ninguna.

## Verificación OBLIGATORIA antes de mergear
- [ ] `cd backend && npm test` (unitarios) verde.
- [ ] `cd backend && npm run test:isolation` — el aislamiento multi-tenant sigue pasando (HR de A no ve datos de B).
- [ ] `cd e2e && npm test` — flujo 5 (aislamiento HR) verde.
- [ ] Gate manual: `grep` que NINGUNA query de datos de tenant en el repository carezca de `companyId`.
- [ ] Test nuevo: una query del repository sin `companyId` debe ser imposible (firma obligatoria) — agregar test que verifique que `listUsers()` sin companyId lanza/no devuelve cross-tenant.

## Anti-patrones a vigilar (del plan maestro)
- NO usar `db` (service_role) sin filtrar por `companyId` en operaciones de tenant.
- NO cambiar las cadenas de middleware (relajar MFA/role = hueco de seguridad).
- NO cambiar contratos de API (mismos paths/shapes; el frontend CompanyAdmin.jsx los consume).

## Orden sugerido de ejecución
1. Crear `tenancy.client.js` + `tenancy.repository.js` con TODAS las queries (firma con companyId obligatorio).
2. Mover rutas públicas (branding/registration) — bajo riesgo, validar primero.
3. Mover rutas HR una familia a la vez (users → invitations → allowlist → dashboard/costs → profile).
4. Correr isolation + E2E tras cada familia.
5. Borrar `routes/company.js`; mover schemas; merge.
