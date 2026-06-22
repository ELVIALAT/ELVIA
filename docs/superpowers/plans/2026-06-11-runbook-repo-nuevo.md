# Runbook — Crear repo nuevo `elvia-platform` con historial desde cero

**Para ejecutar:** 2026-06-11 (Fase 0-A, paso 1 del plan maestro)
**Técnica:** rama huérfana — el repo nuevo recibe UN commit inicial limpio; el historial viejo queda intacto en local (ramas `dev`/`main`) como referencia, sin subirse jamás.

## Pre-decisiones (responder antes de ejecutar)

1. **Nombre del repo:** `elvia-platform` (propuesto) — privado, cuenta `apaz82`.
2. **¿Los 9 logos de `frontend/public/LOGOS/Logo APAZ Talent Search*`?** Están sin trackear. Si son de la plataforma → entran; si son del sitio comercial APAZ → sacarlos de la carpeta antes del commit inicial.
3. **`package.json` + `package-lock.json` + `node_modules/` de la raíz** (solo `potrace`, sin uso): borrarlos a mano antes del commit inicial, o agregar `package.json` raíz a `.gitignore` temporal. Recomendado: borrarlos.

## Pasos

```powershell
# 1. Instalar e iniciar sesión en GitHub CLI (una vez)
winget install GitHub.cli
gh auth login          # browser, cuenta apaz82

# 2. Desde D:\ELVIA\Refact fabre\APP-HR-CVS — crear el repo privado vacío
gh repo create elvia-platform --private --description "ELVIA(R) - Plataforma B2B de acompanamiento en transicion laboral"

# 3. Rama huérfana = historial nuevo (el working tree NO cambia)
git checkout --orphan platform-main
git add -A             # revisar con 'git status' que NO entren logos no deseados ni basura
git commit -m "feat: ELVIA platform - codigo base B2B multi-tenant

Snapshot inicial desde el working copy del refactor (2026-06-11).
Historial previo: repo cv-optimizer-pro (referencia interna).
Plan de modularizacion: docs/superpowers/plans/2026-06-10-plan-maestro-refactor-modular.md"

# 4. Conectar y subir al repo nuevo como main
git remote add platform https://github.com/apaz82/elvia-platform.git
git push -u platform platform-main:main

# 5. Branch protection (CI verde + 1 review para mergear a main)
gh api -X PUT "repos/apaz82/elvia-platform/branches/main/protection" --input - <<'JSON'
{ "required_status_checks": { "strict": true, "contexts": ["Backend — lint & test", "Frontend — build"] },
  "enforce_admins": false,
  "required_pull_request_reviews": { "required_approving_review_count": 1 },
  "restrictions": null }
JSON

# 6. Rama de trabajo
git checkout -b dev2 platform-main   # nueva dev del stack nuevo
git push -u platform dev2:dev
```

## Verificación

- [ ] `gh repo view apaz82/elvia-platform` muestra 1 solo commit en `main`.
- [ ] El repo NO contiene: `gastos-app/`, archivos basura, markdowns en raíz (salvo `CLAUDE.md`), `Onboarding.jsx`, `Landing.jsx`.
- [ ] `git log --oneline dev` local sigue mostrando el historial viejo (referencia preservada).
- [ ] CI corre en el primer PR (el workflow `.github/workflows/ci.yml` ya está en el snapshot).

## Notas

- El remote `origin` (repo viejo `cv-optimizer-pro`) se deja configurado pero NO se le hace push — Telefónica vive de ese stack hasta el cutover (Fase 5).
- Ojo: las ramas locales `dev`/`main` viejas y `platform-main` comparten working tree; trabajar siempre en ramas del remote `platform` de aquí en adelante.
- Siguiente paso tras esto: Fase 0-A pasos 4-8 (Supabase org + staging, Railway, Netlify, Sentry, secrets) — ver plan maestro.
