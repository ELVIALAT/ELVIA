# Modelo Freemium / Planes — Referencia Legacy

**Estado:** ELIMINADO del stack nuevo el 2026-06-22 (ELVIA es B2B puro, acceso full).
**Por qué se documenta:** B2C futuro saldrá con OTRA marca y necesitará su propio modelo de
pricing. Este doc es el mapa para reconstruirlo; el código vive en git.

## Dónde recuperar el código

- **Commit justo antes del borrado:** `b297afcfd83cb7c28caf6c0124f2f993f4a19146`
  (el commit que borra los planes es el siguiente; `git show <ese-commit>` muestra todo lo eliminado).
- **Repo viejo de referencia:** `cv-optimizer-pro` (remote `old-telefonica`) — tiene el modelo vivo en producción Telefónica.

## Tiers que existían

| Plan | cv_optimizer | cv_generar | cv_match | watermark | proGate | Notas |
|------|--------------|------------|----------|-----------|---------|-------|
| `free` | 1 | 1 | 3 | sí | sí | + trial 7-14 días |
| `mensual` | ∞ | ∞ | ∞ | no | no | plan de pago |
| `trimestral` | ∞ | ∞ | ∞ | no | no | plan de pago |
| `b2b` | ∞ | ∞ | ∞ | no | no | usuarios con company_id |

## Mecánica del modelo

- **Trial:** `profiles.free_trial_expires_at` (7 días desde registro; 14 en versiones previas).
  Al expirar y seguir en `free` → bloqueo total de funciones de pago.
- **Contadores freemium:** `profiles.cv_optimizer_count`, `cv_match_count`, `cv_generar_count`,
  `usage_count`. Se incrementaban por uso y se comparaban contra los límites del tier.
- **Degradación:** plan de pago con `plan_expires_at` vencido → vuelve a `free` (en `planContext` y `AuthContext`).
- **Watermark:** los CVs de usuarios `free` salían con marca de agua (`watermark: true`).

## Componentes que implementaban el modelo (todos eliminados)

**Backend (`backend/src/middleware/`):**
- `planContext.js` — leía el estado de plan y lo ponía en `req.planInfo` (PLAN_CONFIG con los tiers). *(simplificado, no borrado: ahora solo verifica `suspended`)*
- `requirePaidPlan.js` — 402 si `plan === 'free'`.
- `requireActiveTrial.js` — 403 si trial expirado.
- `checkCvOptimizeLimit.js` / `checkCvMatchLimit.js` / `checkCvGenerarLimit.js` — 403 al exceder el contador del tier.

**Frontend (`frontend/src/`):**
- `components/common/ProGate.jsx` — pantalla de bloqueo "Función exclusiva Pro" → CTA a /pricing.
- `components/common/FeatureLocked.jsx` — variante de bloqueo.
- `pages/Pricing.jsx` — página de planes de pago.
- `pages/MiPlan.jsx` — estado del plan del usuario.
- `context/AuthContext.jsx` — `planInfo` calculaba `isPaidPlan`, `trialExpired`, `canOptimizeCV`,
  `canMatchCV`, `watermark`, `creditosMatchRestantes`.

## Columnas DB conservadas (NO se borraron — base de tiering B2B futuro)

`profiles.plan`, `companies.plan`, `companies.enabled_features` (JSONB), `access_codes` (sistema de
códigos promocionales). Siguen en el esquema; solo dejaron de gatear el acceso.

## Para reconstruir B2C con marca nueva

1. Diseñar pricing propio (moneda, tiers, pasarela: Stripe/MercadoPago — NO existía pasarela real,
   los planes se asignaban por `access_codes` o manualmente).
2. Recuperar la mecánica de contadores/trial de este doc + el commit referenciado.
3. Adaptar a la marca nueva (no reactivar tal cual — era freemium genérico sin checkout).
