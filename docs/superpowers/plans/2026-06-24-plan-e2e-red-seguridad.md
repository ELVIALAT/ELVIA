# Plan E2E — Red de seguridad antes de seguir refactorizando

Fecha: 2026-06-24
Rama: dev2
Contexto: tras partir los 5 god-files de Fase 3 (hook+context), el riesgo #1 sigue
siendo que el frontend tiene ~0 tests. Antes de seguir partiendo archivos conviene
una red mínima que cace los bugs que de verdad cuestan caro.

---

## La idea en una frase

No buscamos "cobertura". Buscamos una red chiquita y automática que cace **las dos
cosas que sí harían daño**:

1. **Que una empresa vea datos de otra empresa** (ELVIA es multi-tenant, aislado por
   `company_id`). Esto rompería la promesa #1 de confidencialidad. Es lo más grave.
2. **Que las pantallas que acabo de reconstruir se rompan en silencio.** El `diff`
   byte-a-byte probó que el código es *idéntico en estructura*, NO que *funciona cuando
   un humano hace clic*. Un context mal cableado no lo caza el build.

Todo lo demás (cobertura bonita, % de líneas) es secundario y genera mantenimiento.

---

## Contexto de seguridad (importante, y bueno)

**Este ambiente está separado de producción.** El repo/Supabase con el que trabajamos
es el stack nuevo limpio (`evkxbvrbncbtpyvirzee`), no el de clientes reales. Eso quita
el peor miedo: aunque un test se equivoque, NO toca datos de clientes.

Quedan solo **dos cuidados** para "no dañar nada":
- **No mandar emails de verdad.** El endpoint de invitaciones (`POST /api/company/invitations`)
  dispara correo. En tests hay que apuntarlo a un sink/mock, no a buzones reales.
- **No quemar el AI hard cap de Claude.** Los análisis (CV, LinkedIn, entrevista) cuestan
  y tienen tope diario. En tests se "fingen" (stub) — además los hace deterministas.

Regla extra: el código de la app NO se toca para "hacerlo testeable". Solo se agregan
`data-testid` inertes si hacen falta, y los mínimos. Observar, no mutar.

---

## Los 4 pasos (en orden)

### Paso 1 — Preparar el terreno (se hace una sola vez)
- Instalar Playwright (es el framework de E2E que ya marca el manual de estilo del repo).
- Un pequeño "seed": crear datos de prueba marcados (ej. emails `test+...@elvia.test`)
  y un "cleanup" que los borra al terminar. Como el ambiente es de dev, alcanza con
  datos namespaced + borrado; no necesitamos branches efímeros.
- Stubs/mocks de: email (invitaciones), Claude API, OpenAI TTS, subida a Storage.
  → Así ningún test manda correo real ni gasta presupuesto.

### Paso 2 — El test que más importa: aislamiento entre empresas
Esto **no es navegador** — son llamadas HTTP directas al backend con 2 tokens (admin de
empresa A y admin de empresa B). Rápido, estable, sin parpadeos. Los tests clave son los
**negativos** (lo que NO debe poder pasar):
- Admin de A pide `/api/company/{users,invitations,allowlist,dashboard}` → ve SOLO datos
  de A, **nunca de B** (debe dar 403 o vacío).
- Token de A intenta `PATCH /api/company/allowlist/<id-de-B>` → rechazado.
- Usuario normal (no admin) pega a `/api/company/*` → rechazado.
- Ningún endpoint de company devuelve CVs/mensajes individuales (límite de PII).

> Con solo estos 6-8 tests bajamos el riesgo #1 de forma dramática. Es la mejor relación
> cobertura-de-riesgo / esfuerzo de todo el plan. **Si solo hubiera tiempo para una cosa,
> es esta.**

### Paso 3 — Probar las pantallas que reconstruí hoy (navegador, Playwright)
Aquí validamos los refactors de hook+context. Lo que el `diff` NO cubre:
- **CV wizard (lo más delicado):** llenar campos → esperar el autoguardado (2s) → recargar
  la página → **el borrador sigue ahí**. Esto prueba que no rompí los shapes de
  `sessionStorage['cv_draft_…']` ni el `cv_borrador` en BD. Un solo test, mucho valor.
- **Smoke por página refactorizada** (CVDesdeCero, Entrevista, CompanyAdmin, LinkedinPro,
  ProyectoLaboral): la página monta, el `Provider`/context cablea bien, **cero errores de
  consola**, y el camino feliz se ve. Son 5 tests baratos que cazan un context mal
  conectado al instante.

### Paso 4 — Que corra solo
- Conectar la suite a CI (GitHub Actions), al principio **non-blocking** (que no rompa el
  flujo del equipo si algún test parpadea). Cuando estén estables, se vuelven obligatorios.
- Tests flaky → cuarentena, no se borran ni bloquean.

---

## Lo que NO hacer
- ❌ Perseguir un "% de cobertura". Genera tests frágiles y mantenimiento sin valor.
- ❌ Endpoints que mandan email o llaman a Claude sin stub.
- ❌ Tocar código de la app para hacerlo testeable en esta pasada.
- ❌ Empezar por el navegador. El navegador es el Paso 3; el Paso 2 (API de aislamiento)
  da más seguridad por menos esfuerzo y sin parpadeos.

---

## Decisión pendiente para arrancar mañana
Confirmar el **entorno de datos de test**: lo más simple, dado que el ambiente ya está
separado de prod, es usar el Supabase de staging con datos namespaced + cleanup. (La
alternativa más aislada sería Supabase branching, pero suma complejidad que quizá no
hace falta aquí.)

## Orden de ataque sugerido
1. Paso 1 (terreno + stubs).
2. Paso 2 (aislamiento API — la joya).
3. Paso 3, un solo test: CV-wizard recupera borrador.
4. Resto del Paso 3 (smokes) + Paso 4 (CI).
