# Estado del Refactor ELVIA® — Progreso

> Fuente única de verdad del avance. Plan completo: [`plans/2026-06-10-plan-maestro-refactor-modular.md`](plans/2026-06-10-plan-maestro-refactor-modular.md).
> Última actualización: **2026-06-27**.

## Resumen ejecutivo (2026-06-27)

**Fases 0–4 COMPLETAS y en producción.** La transformación monolito → modular está hecha en estructura: backend `modules/`, frontend `features/`, monorepo, red de aislamiento multi-tenant en 3 capas, CI verde y verificable. Todo mergeado a `main` (`fc8af98`) y desplegado (Railway + Netlify, HTTP 200 verificado).

**Lo que queda es deuda puntual** (no estructural) + Fases 5–6. Ver §"Deuda de refactor pendiente".

## Infraestructura (stack nuevo, paralelo al de Telefónica)

| Pieza | Detalle |
|---|---|
| GitHub | `github.com/ELVIALAT/ELVIA` (remote `origin`). Viejo = `old-telefonica` (intocable). |
| Estructura | **Monorepo**: `apps/web` (frontend), `services/api` (backend), `packages/{core,shared-ui}` (skeletons). Deploys por subdirectorio. |
| Supabase staging | `evkxbvrbncbtpyvirzee` — migrations sincronizadas |
| Backend | Railway → `elvia-production.up.railway.app` (Node 22, `services/api`) |
| Frontend | Netlify → `elvialat.netlify.app` (Node 24, `apps/web`) |
| Node | **Pin por servicio**: web=24/npm11 (bug rollup obliga npm11), api=22/npm10. `.nvmrc` per-servicio. |
| CI | `.github/workflows/ci.yml` — jobs `API — lint & test` + `Web — build`. Dispara en `main`/`dev`. |
| Branch protection `main` | PR obligatorio + CI verde requerido, sin force-push/borrado. Reviews=0 (subir a 1 con Fase 6). |
| Sentry | proyecto `node` (backend) + frontend, con PII scrubbing |
| Superadmin | `superadmin@elvia.lat` |

## Decisiones de producto tomadas

- **B2B puro, sin planes freemium.** Acceso full para todos. B2C futuro = OTRA marca. Código freemium documentado en `docs/legacy/freemium-model.md`.
- **Tenant genérico `publico`** (`type=consumer`): ex-B2C; todo usuario tiene `company_id` (nunca null). Lo administra solo el super_admin, sin HR.
- **Features se desbloquean** al completar el Gerente de Búsqueda al 100% (no por pago).

## Fase 0 — Limpieza + stack limpio ✅ COMPLETA

Repo nuevo con historial limpio, staging funcionando, basura eliminada, migrations consolidadas + migration base 000.

## Fase 1 — Red de seguridad ✅ COMPLETA (red de aislamiento ampliada 2026-06-27)

| Tarea | Estado | Notas |
|---|---|---|
| Fixes críticos auditoría | ✅ | Sentry PII scrubbing (front+back), `Math.random`→ok, RLS cv_results |
| Daily cap multi-dimensión | ✅ | global/tenant/user (ADR-004) — `increment_daily_cap_v2` |
| Tests aislamiento BD | ✅ | **20 tests** (6 RLS-JWT + 14 service_role-repo). Cubren cross-tenant read+mutation, dashboard/costs. |
| Playwright E2E | ✅ | **8 tests** vs staging — login, signup, aislamiento HR (GET users/profile/allowlist de B, role-gate 403). |
| Zod en boundaries | ✅ | 6 rutas |
| Envelope de error | ✅ | `apiResponse.js` (retrocompat) |
| Unit `requireTenantContext` | ✅ | corre en CI sin staging |

**Detalle de la red de aislamiento:** ver memoria `elvia-aislamiento-tests`. El invariante load-bearing: el path HR usa service_role (bypasea RLS), el único blindaje es el filtro `companyId` del repository (resuelto server-side, inspoofeable).

## Fase 2 — Backend modular ✅ COMPLETA (con deuda en capa de IA)

Todos los módulos migrados a `modules/<dominio>/` (routes→controller→service→repository→schemas): notifications, linkedin, interview, mentor, jobs, cv, tenancy/company, admin, identity. Suite 123 tests.

⚠️ **Deuda Fase 2 NO ejecutada — capa de IA/servicios legacy** (ver §Deuda):
- `services/api/src/platform/ai/` (router IA unificado) **nunca se creó**.
- `deepseekService.js` (1265 LOC), `claudeService.js` (1070), `resendService.js` (900) sin partir.
- Hack de re-export DeepSeek vivo (`claudeService.js:1069`); `geminiService.js` sin renombrar a `knowledgeBaseService`.

## Fase 3 — Frontend features ✅ COMPLETA (con deuda en data-layer)

God-files partidos (ProyectoLaboral, CVDesdeCero, Entrevista, CompanyAdmin, LinkedinPro + Landing2/CVvsJob/Perfil/MisCVs); **ningún archivo >800 LOC en `apps/web`**. Split AuthContext (useAuth/useProfile/usePlan), route registry único, consolidación PDF (`utils/pdf.js`). Suite 85 tests vitest.

⚠️ **Deuda Fase 3 — data-layer de dominios no migrados** (ver §Deuda): 39 `supabase.from(` directos en ~11 pages (jobs, wellbeing, dashboard, métricas) sin su `api.js`.

## Fase 4 — Monorepo workspaces ✅ COMPLETA

`apps/web` + `services/api` + `packages/*`. Deploys por subdirectorio (NO se usa el campo npm `workspaces` — rompía `npm ci` por-subdir). CI reparado (estaba rojo desde Fase 3). Ver memoria `elvia-fase4-monorepo` + `elvia-ci-monorepo`.

## Deuda de refactor pendiente (medida 2026-06-27)

Priorizada por leverage para construir mejoras encima:

### 1. Capa de IA del backend 🔴 (mayor leverage — Fase 2 ítem #3)
- Crear `services/api/src/platform/ai/` con `routeTask({ task, payload, tenant })`: tiering Haiku/Sonnet, prompt caching de Anthropic, registro de costo por tenant en cada llamada.
- Partir los 3 god-files: `deepseekService.js`, `claudeService.js`, `resendService.js`.
- Eliminar el hack de re-export DeepSeek (`claudeService.js:1069`). Renombrar `geminiService.js` → `knowledgeBaseService.js`.
- **Por qué primero:** es donde más se toca al agregar features de IA; el costo-por-tenant es infra necesaria antes de escalar el uso de Claude.

### 2. Data-layer del frontend 🟡 (consistencia — Fase 3 ítem #2)
- 39 `supabase.from(` directos en pages de dominios *jobs* (Pipeline, JobMatches, MisVacantes), *wellbeing* (Bienestar), *dashboard/métricas* (Dashboard, MisMetricas) → mover a `features/<x>/api.js`.
- Gate: `grep -rn "supabase.from(" apps/web/src/{pages,components}` → tender a 0.

### 3. service_role detrás de repository 🟡 (seguridad/limpieza — gate Fase 2)
- 32 usos directos de `supabaseAdmin` en `admin/`, cron, middleware. **Auditar cuáles son violación real** vs legítimos (ops globales de admin, rate-limit middleware) y mover los reales tras repository.

### Otros (menores)
- Migrar gradualmente los `res.json({error})` inline al envelope unificado al tocar cada módulo.
- Avatar premium del Simulador → spec `specs/2026-06-22-avatar-entrevista-premium.md`.

## Fases 5–6 (pendientes, no son "refactor")

5. **Cutover Telefónica** al stack nuevo (crear `elvia-b2b-prod`, ensayo de migración, runbook, cutover en ventana acordada).
6. **Agentes de calidad en CI**: review bot en PRs (`anthropics/claude-code-action`) + security review + nightly E2E. Al tenerlo, subir branch protection de `main` a 1 review requerido.

## Cómo correr los tests (paths actualizados al monorepo)
```bash
cd services/api && npm test                # unitarios + módulos (123)
cd services/api && npm run test:isolation  # aislamiento BD (requiere services/api/.env.staging)
cd apps/web && npx vitest run              # frontend (vitest)
cd e2e && npm test                         # E2E Playwright (requiere e2e/.env)
```
