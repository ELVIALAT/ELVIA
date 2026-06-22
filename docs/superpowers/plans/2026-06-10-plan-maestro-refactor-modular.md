# Plan Maestro — Refactor Modular de ELVIA® (NO rewrite)

**Fecha:** 2026-06-10
**Autor:** Alejandro Paz + Claude (Fable 5)
**Estado:** EN EJECUCIÓN — Fases 0 y 1 completas (2026-06-22). Ver progreso detallado en `docs/superpowers/ESTADO_REFACTOR.md`.
**Reemplaza/consolida:** `AUDIT_ARCHITECTURE_2026_05_18.md` (plan 4 semanas) + `docs/superpowers/specs/2026-06-01-estabilizacion-y-separacion-b2b-design.md` (spec 8 semanas)
**Cliente activo durante ejecución:** Telefónica México (en pruebas — NO romper producción)

---

## Veredicto: refactor incremental hacia MONOLITO MODULAR. No rewrite. No microservicios.

**Evidencia medida (2026-06-10):**
- Código fuente real: ~47.000 LOC (backend `src/` 10.8k en 56 archivos, frontend `src/` 36k en 117 archivos).
- 1 cliente en pruebas (Telefónica, 3 usuarios), bus factor = 1.
- Tests: 7 archivos (cobertura ~0%). CI ya existe (`.github/workflows/ci.yml`: lint+test backend, build frontend).
- Stack: Vite+React / Express / Supabase / Claude — correcto para esta escala. **El problema es organización del código y proceso, no el stack.**

**Por qué NO rewrite:** producto validado con cliente real; 47k LOC = 2-3 meses de rewrite sin features nuevas = perder momentum con Telefónica; second-system effect; las auditorías coinciden y la evidencia lo confirma.

**Por qué NO microservicios:** 1 desarrollador, 1 tenant, <1k usuarios. Microservicios multiplican deploys, observabilidad y fallos de red sin resolver ningún problema actual. "Dividido por módulos" se logra con **monolito modular + monorepo workspaces**: mismos límites de dominio, un solo deploy. Si algún día hay 8+ devs o un dominio necesita escalar independiente (ej. workers de IA), los módulos ya tienen las costuras para extraerse como servicio.

**Regla de oro de todo el plan:** cada fase deja `main` deployable y a Telefónica funcionando. Nada de big-bang.

---

## Estrategia de ambientes (decisión 2026-06-10): stack limpio paralelo

Telefónica corre en el ambiente VIEJO (`github.com/apaz82/cv-optimizer-pro` + su Supabase/Railway/Netlify actuales) y **no se toca** durante todo el refactor. Esta copia de trabajo se convierte en el stack NUEVO:

| Pieza | Viejo (Telefónica, intocable) | Nuevo (este plan) |
|---|---|---|
| GitHub | `apaz82/cv-optimizer-pro` | Repo nuevo privado (sugerido: `elvia-platform`), **historial limpio desde cero** |
| Supabase | Proyecto actual | Org nueva: `elvia-b2b-staging` + `elvia-b2b-prod` |
| Backend | Railway actual | Servicio Railway nuevo |
| Frontend | Netlify actual | Site Netlify nuevo (staging con subdominio propio) |
| Sentry | Config actual | 2 proyectos nuevos (frontend/backend) con scrubbing desde el día 1 |
| Dominio | `empresas.elvia.lat` → viejo | Cambia al nuevo SOLO en el cutover final (Fase 5) |

**Historial limpio justificado:** verificado 2026-06-10 que no hay secretos reales en el historial (solo `.env.example` con placeholders), pero el historial contiene una app personal ajena al producto (`gastos-app/` "GastoMX", commit `d654c13`) y basura acumulada. El repo viejo queda como archivo de referencia; las decisiones importantes ya viven en `docs/`.

**Consecuencia en el orden:** la Fase 0 (limpieza) se ejecuta AQUÍ antes del primer push, para que el repo nuevo nunca contenga basura. La antigua Fase 5 deja de ser "migrar data planes" y pasa a ser el **cutover final de Telefónica** del stack viejo al nuevo.

---

## ADR-004 (decisión 2026-06-10) — Plataforma 100% B2B; B2C futuro = tenant genérico

**Decisión:** el desarrollo del stack nuevo se enfoca exclusivamente en B2B (venta a compañías). Si B2C se reactiva, los usuarios retail viven en un **tenant genérico** dentro de la misma plataforma (una fila en `companies` con slug tipo `publico`, type `consumer`), NO en una app/BD separada.

**Supersede parcialmente** los ADR-002/ADR-003 del spec 2026-06-01: ya NO hay 3 proyectos Supabase por ambiente ni bundles `apps/b2c` / `apps/universidades`. Queda **una sola BD por ambiente** (`elvia-b2b-staging`, `elvia-b2b-prod`), **una sola app web** y **un solo backend**. Las universidades son tenants normales (Tec ya lo era).

**Razones:** un solo camino de código (elimina los `if (tenant.type)` que marcó la auditoría); menos infraestructura que pagar/operar/migrar; el aislamiento multi-tenant verificado es exactamente lo que audita un comprador corporativo; B2C después cuesta ~0 (abrir self-signup al tenant genérico + pasarela de pago individual); continuidad de producto (colaborador B2B con licencia vencida → convierte al tenant genérico, alineado con "Los Primeros 90 Días").

**Reglas de diseño que esta decisión impone (vigilar en Fases 1-2):**
1. **RLS "dueño de la fila" por defecto** (`user_id`), y la visibilidad intra-tenant de HR es un permiso explícito por rol — NUNCA "todo el tenant lee". En el tenant genérico los usuarios son extraños entre sí.
2. **Límites de IA en dos dimensiones siempre**: per-user Y per-tenant. Un solo cap per-tenant convertiría al tenant genérico en vector de DoS económico entre usuarios B2C.
3. **Tenant context obligatorio en repositories** (Fase 2): mantiene abierta la opción futura de extraer un tenant corporativo a BD dedicada como upsell contractual, sin reescritura.

---

## Mapa de módulos objetivo (derivado de `docs/Casos_de_uso/`)

```
packages/
  core/                  # lógica de negocio compartida (sin React, sin Express)
  shared-ui/             # componentes React reutilizables
apps/
  web/                   # empresas.elvia.lat — única app (ADR-004: B2C futuro = tenant genérico, no app separada)
backend/ (services/api)
  src/modules/
    identity/            # auth, MFA, activación, reset password
    tenancy/             # companies, allowlist, branding, plan/limits per-tenant
    cv/                  # Factoría Harvard, optimizer, CV vs Vacante, infografías
    linkedin/            # LinkedIn® Pro
    interview/           # Simulador de entrevistas
    mentor/              # chat ELVIA, manualChat, knowledge base
    jobs/                # vacantes, matches, pipeline
    wellbeing/           # bienestar
    career-project/      # Proyecto Laboral / Gerente de Búsqueda (6 pilares)
    admin/               # superadmin CRM, cohorts, waitlist/referidos
    notifications/       # email (Resend), OTP
  src/platform/          # ai-router, supabase clients, logger, errors, middleware genérico
```

Cada módulo backend: `routes.js` (solo wiring) → `controller.js` (HTTP) → `service.js` (negocio) → `repository.js` (única capa que toca Supabase) → `schemas.js` (zod).

---

## FASE 0 — Limpieza local + bootstrap del stack limpio (3-4 días)

**Objetivo:** repo limpio, una sola fuente de verdad para migrations, repo GitHub nuevo con protección de rama, staging nuevo funcionando.

### 0-A. Bootstrap de infraestructura nueva (requiere acciones del operador, 1 vez c/u)

| # | Acción | Quién |
|---|--------|-------|
| 1 | Instalar CLIs: `gh`, `supabase`, `netlify`, `railway` (winget/npm) | Claude instala, operador aprueba |
| 2 | `gh auth login`, `supabase login`, `netlify login`, `railway login` (browser) | Operador (1 min c/u) |
| 3 | Crear repo privado `elvia-platform` + branch protection en `main` | Claude vía `gh` |
| 4 | Crear org Supabase nueva + proyecto `elvia-b2b-staging` (prod se crea en Fase 5) | Operador crea org (billing); Claude crea proyectos vía CLI |
| 5 | Aplicar migrations consolidadas + seeds demo a staging | Claude vía `supabase db push` |
| 6 | Servicio Railway nuevo (backend) + site Netlify nuevo (frontend) apuntando a staging | Claude vía CLI; operador aprueba billing |
| 7 | Sentry: 2 proyectos nuevos con `beforeSend` scrubbing; DSNs a env vars | Operador da API token; Claude configura |
| 8 | Secrets de GitHub Actions: `ANTHROPIC_API_KEY`, keys de staging | Operador provee valores; Claude los setea vía `gh secret set` |

### 0-B. Limpieza local (antes del primer push al repo nuevo)

Tareas:
1. Borrar archivos basura de raíz (restos de `&&` mal escapado en PowerShell): `({...t`, `[...prev`, `r.ok`, `subtipo'`, `t.target.style.display`, `{,+`, `},`, `Supabase),`, `generarReporteCompensacion(data)`, `resolve(reader.result.split('`. Verificar con `git status` que ninguno está commiteado antes de borrar.
2. Borrar código muerto confirmado por auditoría 05-18: `frontend/src/pages/Onboarding.jsx` (1.297 LOC, no importado), `Landing.jsx` + `Landing2.jsx` (verificar primero en `App.jsx` que no estén ruteados), scripts sueltos en `backend/` raíz (`add_column.js`, `check-*.js`, `list-models.js`).
3. Consolidar las 5 fuentes de migrations en `supabase/migrations/` con Supabase CLI (numeración por timestamp). Resolver colisión de las dos `009_*.sql`. Archivar `DB_MIGRATION_SQL.sql`.
4. Mover los 16+ markdowns de auditoría de la raíz a `docs/audits/` con un índice.
5. GitHub: branch protection en `main` (CI verde + 1 review obligatorio — el review puede ser el agente de la Fase 6).

Verificación:
- [ ] `npm run build` (frontend) y `npm run check` (backend) verdes.
- [ ] `grep -r "Onboarding\b" frontend/src --include="*.jsx"` sin referencias a la página borrada.
- [ ] `supabase migration list` muestra fuente única sin colisiones.
- [ ] Primer push al repo nuevo: commit inicial limpio, sin `gastos-app/`, sin basura, sin markdowns sueltos en raíz.
- [ ] Push directo a `main` rechazado por GitHub (branch protection activo).
- [ ] App completa funcionando contra `elvia-b2b-staging` en las URLs nuevas de Netlify/Railway.

Anti-patrones: NO refactorizar lógica en esta fase; solo borrar/mover. NO tocar nada que `App.jsx` importe sin verificar.

---

## FASE 1 — Red de seguridad (1 semana) ⚠️ ANTES de mover código

**Objetivo:** que sea imposible romper el aislamiento multi-tenant o producción sin que CI lo detecte.

Tareas:
1. **Verificar estado de los fixes críticos de la auditoría 05-18** (pueden estar ya aplicados — confirmar, no asumir): RLS en `cv_results`; `dailyCap` per-tenant (`backend/src/middleware/dailyCap.js`); Sentry `beforeSend` scrubbing (frontend `main.jsx` + backend `app.js`); `Math.random()` → `crypto.randomBytes` en `company.js` (pendiente según `project_state.md:65`).
2. **Playwright E2E** (`e2e/` en raíz, job nuevo en `ci.yml`) con los 5 flujos del spec 06-01 §6.1, en especial: *HR de empresa A no puede ver datos de empresa B* y *mismatch company_id token vs URL → 403*.
3. **Tests de aislamiento a nivel BD**: script que con el JWT de un usuario A intenta leer `cv_results`/`profiles`/`companies` de B → debe devolver 0 filas. Correr contra staging en CI.
4. **Zod en boundaries** de las 6 rutas más grandes (`/cv/optimize`, `/company/registration`, `/company/allowlist`, `/admin/*`, `/jobs`, `/email`). Crear `schemas.js` por ruta; rechazar con envelope unificado.
5. **Envelope de error unificado**: `{ success, data, error: { code, message } }` + middleware `errorHandler` central. Eliminar gradualmente los 4 formatos actuales (los 156 `res.status().json()` inline se migran al tocar cada módulo en Fase 2, no todos ahora).

Verificación:
- [ ] CI corre Playwright y bloquea merge si falla aislamiento.
- [ ] `grep -rn "Math.random" backend/src/routes/company.js` → 0 resultados.
- [ ] Requests con body inválido a las 6 rutas devuelven 400 con envelope, no 500.

Anti-patrones: NO usar `supabaseAdmin` como fallback cuando RLS rechaza (patrón `cvGenerarController.js:201` — eso convierte un error de seguridad en bypass silencioso). NO inventar APIs de zod: usar `z.object().safeParse()` documentado.

---

## FASE 2 — Backend: monolito modular (2 semanas, 1 módulo por PR)

**Objetivo:** `backend/src/modules/<dominio>/` con el patrón routes→controller→service→repository→schemas. **Migración por módulo, nunca todos a la vez.**

Orden sugerido (de menor a mayor riesgo): `notifications` → `linkedin` → `interview` → `mentor` → `jobs` → `cv` → `tenancy`+`company` (el más delicado: 1.308 LOC con service_role) → `admin` → `identity`.

Reglas estructurales:
1. **Repository pattern**: SOLO `*.repository.js` importa `lib/supabase.js`. Toda query lleva tenant context explícito.
2. **Prohibir service_role fuera de repositories**: gate en CI — `grep -rn "SUPABASE_SERVICE_ROLE_KEY\|supabaseAdmin" backend/src --include="*.js" | grep -v repository | grep -v platform/` debe dar 0. Esto mata el problema C-3 de la auditoría (RLS bypassed en `routes/company.js:32`).
3. **Router IA unificado** en `platform/ai/`: `routeTask({ task, payload, tenant })` con tiering (Haiku para extracción/clasificación, Sonnet para optimización final), prompt caching de Anthropic, y registro de costo por tenant en cada llamada. Elimina el hack de `claudeService.js:974` (re-export de DeepSeek) y renombra `geminiService.js` → `knowledgeBaseService.js`.
4. Mover lógica de `routes/jobs.js` (618 LOC) y `routes/email.js` (592 LOC) a sus controllers; borrar los placeholders de 7 líneas.
5. Tests unitarios por módulo migrado (vitest o node:test): mínimo service + repository con mocks. Regla: módulo migrado = módulo con tests.

Verificación por PR de módulo:
- [ ] E2E de Fase 1 verdes (garantía de no-regresión).
- [ ] Gate de service_role en CI verde.
- [ ] Ruta antigua eliminada (no coexisten dos versiones del mismo endpoint).
- [ ] Smoke test manual del flujo en staging.

Anti-patrones: NO "big bang" de carpetas (mover 56 archivos en un PR). NO cambiar contratos de API que el frontend consume (mismos paths y shapes hasta Fase 3). NO dejar `routes/company.js` para "después" — es el módulo con más riesgo de seguridad y va dentro de esta fase.

---

## FASE 3 — Frontend: features y dietas de god-files (2 semanas)

**Objetivo:** `frontend/src/features/<dominio>/` espejando los módulos backend; ningún archivo >800 LOC; cero `supabase.from(` en componentes.

Tareas:
1. **Partir god-files** (meta del spec 06-01: ≤500 LOC c/u):
   - `ProyectoLaboral.jsx` (3.605) → `features/career-project/` con 1 componente por pilar (los 6 pilares del Gerente de Búsqueda) + hooks de datos.
   - `CVDesdeCero.jsx` (2.079) → `features/cv/` con 1 componente por paso del wizard.
   - `Entrevista.jsx` (1.181), `CompanyAdmin.jsx` (1.151), `LinkedinPro.jsx` (1.137) — mismo tratamiento.
2. **Capa de datos**: los ~47 `supabase.from(` directos en componentes → `features/<x>/api.js` (repository por dominio). Gate CI: `grep -rn "supabase.from(" frontend/src/pages frontend/src/components | wc -l` debe tender a 0.
3. **Split de `AuthContext.jsx`** (304 LOC, 20+ valores) en `AuthContext` (sesión), `ProfileContext` (datos), `PlanContext` (gating) — hoy cada token refresh re-renderiza 50 páginas.
4. **Route registry único** en `App.jsx`: una sola lista de rutas con metadata `{ path, element, guard, layout }` en vez de las 5 listas paralelas + 4 guards actuales.
5. Reducir librerías PDF de 3-4 a 1 (`pdf-lib` ya es el estándar del proyecto según CLAUDE.md) — auditar usos de `html2pdf`/`jspdf`/`html2canvas` y consolidar.

Verificación:
- [ ] `find frontend/src -name "*.jsx" -exec wc -l {} + | sort -rn | head -3` → ninguno >800.
- [ ] Build de producción sin regresión de bundle (comparar `dist/assets` antes/después).
- [ ] E2E verdes; smoke manual de los 6 pilares y la Factoría CV en staging.

Anti-patrones: NO reescribir UI al partir archivos (extraer tal cual, refactor visual después). NO cambiar shapes de `sessionStorage` que mantienen estado entre tabs del Proyecto Laboral (regla de CLAUDE.md). Respetar la discrepancia documentada `soft_skills`→"Power Skills" (`project_state.md:29-37`) — NO renombrar columnas de BD.

---

## FASE 4 — Monorepo workspaces (1 semana)

**Objetivo:** estructura física del ADR-002 del spec 06-01 sin cambiar deploys todavía.

1. npm workspaces (o pnpm + turborepo si el cache de CI lo amerita): `packages/core`, `packages/shared-ui`, `apps/web`, `services/api` (el backend actual).
2. Mover a `packages/core` SOLO lo que ya quedó desacoplado en Fases 2-3 (parsers, scoring, prompts, tipos compartidos). Si algo necesita React o Express, no va en core.
3. CI por workspace con paths filters (no rebuilbear todo en cada PR).
4. Netlify/Railway apuntando a los nuevos paths (`apps/web`, `services/api`).

Verificación: deploy a staging desde el monorepo idéntico en comportamiento; `npm ls` sin dependencias circulares entre workspaces.

Anti-patrón: NO crear `apps/b2c` nunca (ADR-004) — si B2C se reactiva, es un tenant genérico en la misma app, con landing y features propias vía tenant branding/flags.

---

## FASE 5 — Cutover de Telefónica al stack nuevo (1-2 semanas)

El staging nuevo ya existe desde Fase 0-A; aquí se crea producción y se muda el cliente:
1. Crear `elvia-b2b-prod` en la org nueva; aplicar migrations consolidadas; configurar Railway/Netlify de producción.
2. **Ensayo de migración** en staging: export del Supabase viejo (data de Telefónica: `auth.users`, `profiles`, `companies`, `cv_results`, storage buckets) → import → verificación de conteos por tabla → suite E2E completa → login de prueba con usuarios reales de Telefónica (coordinado).
3. Documentar runbook de cutover (paso a paso + tiempos + criterios de rollback).
4. **Cutover real** en ventana acordada con Telefónica: freeze del stack viejo → export/import a `elvia-b2b-prod` → `empresas.elvia.lat` (DNS) apunta al Netlify nuevo → smoke test con el cliente.
5. Stack viejo queda en read-only 2 semanas como rollback; después se archiva (repo viejo NO se borra — es referencia histórica).
6. NO existe `elvia-b2c-prod` (ADR-004): si B2C se reactiva, es el tenant genérico `publico` dentro de `elvia-b2b-prod` — cero proyectos adicionales.

Verificación: criterios del spec 06-01 §2.2 (Telefónica en `empresas.elvia.lat` → `elvia-b2b-prod`; aislamiento E2E verde contra la BD nueva; usuarios de Telefónica entran con sus credenciales sin fricción).

---

## FASE 6 — Agentes de calidad y vigilancia de bugs (2-3 días de setup, beneficio permanente)

**Objetivo:** "agentes revisando bugs" de forma continua, en 3 capas:

### Capa 1 — En cada PR (GitHub Actions)
1. **`anthropics/claude-code-action`** con prompt de revisión: bugs, regresiones de aislamiento multi-tenant, manejo de errores, contratos de API. Postea comentarios en el PR.
2. **Security review automatizado** (workflow separado con prompt de seguridad: secrets, RLS, injection, XSS/SSRF — alineado con el checklist de `~/.claude/rules/common/security.md`).
3. Gates duros existentes + nuevos: lint, tests, build, Playwright E2E, gate de `service_role`, gate de tamaño de archivo (>800 LOC falla).

### Capa 2 — Vigilancia nocturna (cron en Actions)
4. Job nightly que: corre la suite E2E completa contra staging, `npm audit` en los 3 workspaces, consulta la API de Sentry por issues nuevos de las últimas 24h, y **abre GitHub Issues etiquetados** (`bug-sweep`) con resumen y stack trace. Un agente de Claude Code puede ejecutarse sobre esos issues para proponer el fix en un PR borrador.
5. Renovate o Dependabot para dependencias (agrupado semanal, no ruido diario).

### Capa 3 — Operación
6. Sentry alert rules → email/WhatsApp del operador en errores P1 (criterio del spec 06-01).
7. Dashboard de costo IA por tenant (ya habilitado por el router IA de Fase 2 que registra costo por llamada).
8. En local: hooks PostToolUse para lint/format, y revisión con agente `code-reviewer` antes de cada PR (más `/code-review ultra` para los PRs grandes de Fases 2-3).

Verificación: PR de prueba con bug intencional (query sin `company_id`) → el agente lo señala y el gate lo bloquea.

---

## Cronograma y dependencias

```
Semana 1:      F0 Limpieza local + bootstrap stack nuevo (repo, staging, deploys)
Semana 2:      F1 Red de seguridad ──► F6 Capa 1 (agentes en PR — protege Fases 2-3)
Semanas 3-4:   F2 Backend modular (1 módulo por PR)
Semanas 5-6:   F3 Frontend features
Semana 7:      F4 Monorepo
Semanas 8-9:   F5 elvia-b2b-prod + cutover Telefónica (ensayado en staging)
Semana 9+:     F6 Capas 2-3 (nightly + operación)

Ventaja clave de esta secuencia: Telefónica corre en el stack viejo intocable
durante las 8 primeras semanas — riesgo cero para el cliente hasta el cutover.
```

La Capa 1 de agentes se adelanta a la semana 2 deliberadamente: los PRs grandes del refactor (Fases 2-3) son exactamente donde un revisor automático paga más.

## Qué NO hacer (lista de bloqueo)

- ❌ Rewrite desde cero o cambio de stack (Next.js, NestJS, microservicios) — re-evaluar solo si: equipo ≥8 devs, o un dominio necesita SLA/escala independiente.
- ❌ Redis/BullMQ ahora — las costuras de módulos de F2 permiten añadir cola async cuando el volumen de llamadas IA lo exija (>~200 usuarios concurrentes según auditoría 05-18).
- ❌ TypeScript big-bang — opcional y gradual: nuevo código de `packages/core` puede nacer en TS con `allowJs`; no migrar los 47k LOC.
- ❌ Tocar contratos de BD usados por Telefónica sin migración versionada + ensayo en staging.
