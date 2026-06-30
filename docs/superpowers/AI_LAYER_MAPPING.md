# Mapeo de la Capa de IA — Refactor #1 (`platform/ai/`)

> Paso 0 del Refactor #1: inventario fiel de cada función de IA **viva**, su tier propuesto
> (Haiku/Sonnet) y su exposición PII, para que la migración al router no rompa nada.
> Estado medido el **2026-06-30** sobre `dev2` @ `14e76fd`. Tracker hermano: [`ESTADO_REFACTOR.md`](ESTADO_REFACTOR.md).

> **Estado implementación (2026-06-30):** router `platform/ai/` + ledger de costo por tenant + dashboard
> construidos y verificados (**pasos 1-4**). 137/137 Jest · `npm run check` verde · `vite build` verde ·
> smoke ALS OK. Default = **Híbrido por PII** (PII→Claude lock, no-PII→DeepSeek).
> Commits dev2: `fa0df71` (router) · `7e8c008` (ledger+endpoint) · `cbc2ae3` (dashboard).
> Pendiente: aplicar migración `ai_usage` a staging/prod · paso 5 (limpieza: borrar claudeService muerto + rename gemini) · split resend.

## 🔴 Hallazgo que invierte el plan original

El plan asumía migrar `claudeService.js` al router. La realidad medida:

- **[`services/api/src/services/claudeService.js`](../../services/api/src/services/claudeService.js) (1070 LOC) es CÓDIGO MUERTO.** Cero importadores en todo el repo (`grep` exit 1). Conserva las implementaciones Claude (con caching y sanitización PII) que sirven de **referencia** para el tier premium, pero no está en el camino vivo.
- **[`services/api/src/services/deepseekService.js`](../../services/api/src/services/deepseekService.js) (1266 LOC) es el god-file VIVO.** Todo prod corre por aquí. Hubo una migración previa **Claude → DeepSeek** (~70% más barato) que dejó `claudeService` abandonado y un re-export reliquia (`generarPreguntasEntrevista`).
- **[`services/api/src/services/geminiService.js`](../../services/api/src/services/geminiService.js) (48 LOC) ya no es Gemini**: es un text-search de Supabase (`searchKnowledgeBase`). Su único caller es `claudeService` (muerto) → **huérfano**. El chat vivo NO usa RAG hoy. Plan: renombrar a `knowledgeBaseService` y decidir si se recablea al chat.
- **Tests = Jest** (no Vitest). Mockean `services/deepseekService` y `services/claudeManualService` por ruta directa → **la migración debe conservar esas rutas de import** (facade que delega al router).
- **No existe infra de costo/tenant.** Greenfield.

**Implicación:** el diseño "Claude-only de arranque" **revierte** la migración a DeepSeek → es un cambio real de costo y output en prod, no cosmético. De ahí la importancia de este mapeo.

## Consumidores vivos (quién llama qué)

| Consumidor | Importa de | Funciones |
|---|---|---|
| [`cv.controller.js`](../../services/api/src/modules/cv/cv.controller.js) | `deepseekService` | `optimizeCV`, `matchCVtoJob`, `extraerDatosInfografia`, `corregirProyectoLaboral`, `generarCarta`, `optimizarResumen`, `fusionarResumen`, `optimizarDescripcionExp`, `extractProfileFromCV` |
| [`interview.service.js`](../../services/api/src/modules/interview/interview.service.js) | `deepseekService` | `generarPreguntasEntrevista`, `evaluarEntrevista` |
| [`linkedin.service.js`](../../services/api/src/modules/linkedin/linkedin.service.js) | `deepseekService` | `analizarLinkedin`, `extraerDatosLinkedin` |
| [`mentor.service.js`](../../services/api/src/modules/mentor/mentor.service.js) | `deepseekService` + `claudeManualService` | `generateChatResponse` (DS) + `responderConManual` (Claude Haiku ✅) |
| varios (email, fuera de scope IA) | `resendService` | 6 consumidores — split aparte |

## Mapeo función → tier → PII

**PII-CV** = la llamada toca CV crudo o extrae datos de contacto → **Claude-lock** (nunca fallback a DeepSeek).
**DS-elegible** = candidata a DeepSeek pluggable (válvula de escape de costo) más adelante.

### 🟪 PREMIUM → Sonnet + caching

| Función | Modelo vivo | Tier propuesto | PII-CV | DS-elegible | Notas de fidelidad |
|---|---|---|---|---|---|
| `optimizeCV` | deepseek-chat | **Sonnet** | 🔴 Alta | ❌ lock | Comparte `SISTEMA_BASE` (cache). Tiene sanitizador anti-alucinación PII. Retry si falta `<CV>`. |
| `matchCVtoJob` | deepseek-chat | **Sonnet** | 🔴 Alta | ❌ lock | `SISTEMA_BASE` (cache). DS añadió `contextoUbicacion` + rúbrica de score que claudeService NO tiene → portar la versión DS. |
| `generarCarta` | deepseek-chat | **Sonnet** | 🔴 Alta | ❌ lock | `SISTEMA_BASE` (cache). |
| `optimizarResumen` | deepseek-chat | **Sonnet** | 🟡 Baja | ✅ sí | Output de alta visibilidad (resumen headline). |
| `fusionarResumen` | deepseek-chat | **Sonnet** | 🟡 Baja | ✅ sí | Cero invención; temp 0.2. |
| `analizarLinkedin` | deepseek-chat | **Sonnet** | 🟡 Media | ✅ sí | Análisis estratégico grande (JSON). DS tiene `idiomas` + `sugerencias_aplicables` que claude NO → portar versión DS. |
| `evaluarEntrevista` ⚠️ | deepseek-chat | **Sonnet** (borderline Haiku) | 🟢 Baja | ✅ sí | Reporte de feedback = entregable → Sonnet. |

### 🟦 EXTRACCIÓN/PARSING → Haiku + caching

| Función | Modelo vivo | Tier propuesto | PII-CV | DS-elegible | Notas de fidelidad |
|---|---|---|---|---|---|
| `extractProfileFromCV` | deepseek-chat | **Haiku** | 🔴 Alta | ❌ lock | **Solo existe en DeepSeek** (no hay versión claude) → portar, no copiar. temp 0.1. |
| `extraerDatosInfografia` | deepseek-chat | **Haiku** | 🔴 Alta | ❌ lock | Extrae contacto. claudeService usaba Haiku (`MODELO_RAPIDO`). |
| `extraerDatosLinkedin` | deepseek-chat | **Haiku** | 🟠 Media-alta | ❌ lock | DS añadió campo `idiomas` que claude NO → portar versión DS. |
| `corregirProyectoLaboral` | deepseek-chat | **Haiku** | 🟢 Baja | ✅ sí | Corrección ortográfica/estilo. |
| `generarPreguntasEntrevista` | deepseek-chat | **Haiku** | 🔴 Alta (`cv_base`) | ❌ lock | **DECIDIDO: PII-lock** — lleva `cv_base` (CV crudo) → Claude por confidencialidad. |
| `optimizarDescripcionExp` ⚠️ | deepseek-chat | **Haiku** | 🟢 Baja | ✅ sí | **Solo existe en DeepSeek** → portar. Alta frecuencia (por experiencia). |

### 🟩 CHAT → Haiku

| Función | Modelo vivo | Tier propuesto | PII-CV | Notas |
|---|---|---|---|---|
| `generateChatResponse` | deepseek-chat | **Haiku** | 🟢 Baja | ⚠️ Prompt DS (anchors del manual) ≠ prompt Claude (RAG vía gemini). NO son 1:1 — decidir cuál conservar. |
| `responderConManual` | **claude-haiku ✅** | **Haiku** (sin cambio) | 🟢 Baja | Ya en Claude + manual cacheado. **Modelo de referencia del "caching agresivo" bien hecho.** |

⚠️ = tier borderline o decisión de prompt pendiente.

## Estrategia de routing recomendada: **Híbrido por PII**

Costo-eficiente a escala = gastar tokens caros solo donde **privacidad o calidad** lo exigen.
Costo relativo aprox/token: DeepSeek ≈ 1× · Haiku ≈ 3-4× · Sonnet ≈ 10×+ (capturar real en el ledger).

1. **PII-CV → Claude-lock** (Haiku extrae / Sonnet premium). Nunca DeepSeek. La privacidad domina el costo.
2. **Premium no-PII → Sonnet + caching.** Es el entregable que se paga.
3. **Bulk no-PII → Haiku default + DeepSeek como válvula de escape** (pluggable, diferido, por config).

**Palancas de ahorro a escala:**
- **Prompt caching (#1):** `SISTEMA_BASE` compartido por optimizeCV/matchCVtoJob/generarCarta → cache-read ~0.1×. A volumen B2B domina el costo.
- **Ledger de costo por tenant** → habilita el *AI Hard Cap por tenant* (ya en CLAUDE.md).
- **Lock estructural:** tareas PII no pueden asignarse a un provider no-Claude ni por config.

## Plan de aterrizaje (sin romper prod)

1. ✅ **HECHO** — `services/api/src/platform/ai/` con `routeTask({ task, payload, tenant })` + tabla de política `policy.js` (task → {claudeModel, piiLock}).
2. ✅ **HECHO** — providers `claude` (Haiku/Sonnet + caching del system) y `deepseek` (pluggable). `complete()` = primitiva central (resolve → provider → recordCost).
3. ✅ **HECHO** — `deepseekService.js` convertido a **facade fino** → rutas de import y mocks Jest verdes (123/123). `claudeService.js` (muerto) intacto, se elimina en paso 5.
4. ✅ **HECHO** — **Ledger de costo por tenant + dashboard**. Threading de tenant vía AsyncLocalStorage
   (`context.js` + middleware `aiContext`; `auth` escribe userId, `dailyCap` escribe company_id). `ledger.js`
   persiste tokens crudos en `ai_usage` (fire-and-forget, cache user→company). Endpoint super_admin
   `GET /api/admin/ai-cost` + tab "Costo IA" en el Admin Center. **Migración `ai_usage` pendiente de aplicar.**
5. ⏳ Matar `claudeService.js` (muerto) + re-export reliquia + renombrar `geminiService` → `knowledgeBaseService`.
6. ⏳ Split del god-file de email `resendService.js` (900 LOC) — fuera de scope IA, cleanup aparte.

**Estructura creada:**
```
platform/ai/
  index.js          routeTask({task,payload,tenant}) + named exports + complete
  policy.js         TASKS + POLICY (claudeModel, piiLock) + resolve()
  complete.js       primitiva: resolve → provider.call → recordCost (lee ALS)
  context.js        AsyncLocalStorage por request (userId/tenant)
  providers/        claude.js (Haiku/Sonnet + cache_control) · deepseek.js (pluggable)
  cost/             ledger.js (persiste ai_usage) · rates.js (tarifas) · report.js (aggregateByTenant)
  shared/           sistema.js (SISTEMA_BASE, ETIQUETA_IDIOMA) · pii.js · parsers.js
  tasks/            cv.js · interview.js · linkedin.js · mentor.js · index.js (14 fns)
middleware/aiContext.js   · modules/admin/admin.aiCost.js   · migration 20260630_ai_usage_ledger.sql
apps/web .../tabs/AiCostTab.jsx   (dashboard super_admin)
```

## Decisiones (resueltas)

- [x] **Default del router**: **Híbrido por PII** (OK del owner: "alta calidad y confidencialidad").
- [x] **`generarPreguntasEntrevista`**: **PII-lock → Claude Haiku** (lleva `cv_base` = CV crudo).
- [x] **Tiers**: `evaluarEntrevista` → Sonnet · `optimizarDescripcionExp` → Haiku.
- [x] **Prompt del chat**: se conserva el de DeepSeek (anchors del manual, más completo).

## Decisiones (resueltas, pasos 4)

- [x] **Threading de tenant**: **AsyncLocalStorage** (`context.js` + middleware `aiContext`). userId desde `auth`, company_id reusando el que `dailyCap` ya resuelve; fallback a resolver desde userId en el persist (cacheado). Verificado que sobrevive `await` y aísla requests concurrentes.

## Decisiones pendientes (paso 5 / ops)

- [ ] **Aplicar migración `ai_usage`** a staging/prod (hasta entonces `recordCost` no-opea sin tabla).
- [ ] **Verificar tarifas** en `cost/rates.js` contra precios oficiales vigentes (son aproximadas).
- [ ] **Flip de bulk no-PII**: cuándo mover `resumen`/`descripcionExp`/`corregirProyecto`/`analizar`/`evaluar`/`chat` a Claude (hoy DeepSeek). Palanca: `AI_NONPII_PROVIDER=claude`.
- [ ] **RAG**: ¿recablear `searchKnowledgeBase` (hoy huérfano) al chat vivo o dejarlo fuera?
