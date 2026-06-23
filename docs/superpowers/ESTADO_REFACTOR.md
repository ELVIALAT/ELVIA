# Estado del Refactor ELVIA® — Progreso

> Fuente única de verdad del avance. Plan completo: [`plans/2026-06-10-plan-maestro-refactor-modular.md`](plans/2026-06-10-plan-maestro-refactor-modular.md).
> Última actualización: **2026-06-22**.

## Infraestructura (stack nuevo, paralelo al de Telefónica)

| Pieza | Detalle |
|---|---|
| GitHub | `github.com/ELVIALAT/ELVIA` (remote `origin`). Viejo = `old-telefonica` (intocable). |
| Supabase staging | `evkxbvrbncbtpyvirzee` — migrations sincronizadas |
| Backend | Railway → `elvia-production.up.railway.app` |
| Frontend | Netlify → `elvialat.netlify.app` |
| Sentry | proyecto `node` (backend) + frontend, con PII scrubbing |
| Superadmin | `superadmin@elvia.lat` |

## Decisiones de producto tomadas

- **B2B puro, sin planes freemium.** Acceso full para todos. B2C futuro = OTRA marca (no reactivar planes). Código freemium documentado en `docs/legacy/freemium-model.md`.
- **Tenant genérico `publico`** (`type=consumer`): ex-B2C; todo usuario tiene `company_id` (nunca null). Lo administra solo el super_admin, sin HR.
- **Features se desbloquean** al completar el Gerente de Búsqueda al 100% (no por pago).

## Fase 0 — Limpieza + stack limpio ✅ COMPLETA

Repo nuevo con historial limpio, staging funcionando (Supabase/Railway/Netlify/Sentry), basura eliminada, migrations consolidadas + migration base 000 (las tablas fundacionales no estaban versionadas en el stack viejo).

## Fase 1 — Red de seguridad ✅ COMPLETA

| Tarea | Estado | Notas |
|---|---|---|
| Fixes críticos auditoría | ✅ | Sentry PII scrubbing (front+back), `Math.random`→ok, RLS cv_results |
| Daily cap multi-dimensión | ✅ | global/tenant/user (ADR-004) — `increment_daily_cap_v2` |
| Tests aislamiento BD | ✅ | 6 tests, JWT real + RLS (`backend/tests/isolation/`) |
| Playwright E2E | ✅ | 4 tests, staging (`e2e/`) — login, signup, aislamiento HR |
| Zod en boundaries | ✅ | 6 rutas (`src/schemas/`, `src/middleware/validate.js`) |
| Envelope de error | ✅ | `src/lib/apiResponse.js` (retrocompat string + forma nueva) |

**Bugs encontrados y corregidos por la red de seguridad:**
- Recursión infinita en RLS de `profiles` (causaba "Error al cargar tus datos" / 500).
- `job_search_profile` mal modelado como tabla (es columna JSONB); `user_events` faltante.
- `companies.nombre` vs `name`.

**Cobertura de tests:** 47 unitarios + 6 aislamiento + 4 E2E (antes: ~0).

### Cómo correr los tests
```bash
cd backend && npm test               # unitarios (47)
cd backend && npm run test:isolation # aislamiento BD (requiere backend/.env.staging)
cd e2e && npm test                   # E2E Playwright (requiere e2e/.env)
```

## Fase 2 — Backend modular 🔄 EN PROGRESO

Migrar `backend/src/` a `modules/<dominio>/` (routes→controller→service→repository→schemas), **1 módulo por PR** (rama `feat/module-<x>` → merge a `dev`). Orden: `notifications` → `linkedin` → `interview` → `mentor` → `jobs` → `cv` → `tenancy`/`company` → `admin` → `identity`.

| Módulo | Estado | Notas |
|---|---|---|
| notifications | ✅ | PILOTO — patrón de referencia. `POST /api/email/send` → `/api/notifications/send-cv`. 4 tests. |
| linkedin | ✅ | LinkedIn® Pro. Mismo path `/api/linkedin`. 8 funciones repo, 9 tests. |
| interview | ✅ | Simulador. `/api/interview`. 5 tests. **Pendiente avatar premium** → spec `specs/2026-06-22-avatar-entrevista-premium.md`. |
| mentor | ✅ | Chat ELVIA (general + manual). `/api/chat` y `/api/chat/manual`. Sin repository (no toca DB). 5 tests. |
| jobs | ✅ | Vacantes/matches. `/api/jobs`. 612 LOC → providers/ssrf/ai/repo/service. 6 tests. |
| cv | ⏳ | siguiente (grande) |
| tenancy/company, admin, identity | ⏳ | |

**Nota Fase 3:** el Gerente de Búsqueda (`ProyectoLaboral.jsx`, 3605 LOC, 6 pilares) casi no tiene backend (datos en `profiles.job_search_profile`); su refactor real es Fase 3 (frontend) — primer god-file a partir. Reglas: no tocar sessionStorage ni columna `soft_skills`.

**Patrón establecido (replicar):** `<modulo>.routes.js` (wiring) → `.controller.js` (HTTP + envelope) → `.service.js` (negocio, errores de dominio con `code`) → `.repository.js` (ÚNICA capa que toca Supabase, queries con contexto) → `.schemas.js` (Zod). HTML/templates en `templates/`. Tests en `tests/modules/`.

Pendientes anotados:
- **Refactor `/admin`** (admin.js backend en F2; Admin.jsx + components/admin en F3).
- Migrar gradualmente los 193 `res.json({error})` inline al envelope al tocar cada módulo.

## Fases 3-6 (pendientes)
3. Frontend features + partir god-files. 4. Monorepo workspaces. 5. Cutover Telefónica. 6. Agentes de calidad en CI.
