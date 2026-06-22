# Demo Telefónica — Bot ELVIA Modo Manual + /ayuda

**Fecha:** 2026-06-XX  
**Ambiente:** Producción (https://elvia.lat) o Preview Netlify

## Pre-flight
- [ ] `node scripts/sync-manual.js` ejecutado y diff vs main commiteado
- [ ] Backend Railway redeployed con cambios
- [ ] Frontend Netlify redeployed con cambios
- [ ] Env var `ANTHROPIC_API_KEY` presente en Railway
- [ ] Env var `CLAUDE_MANUAL_MODEL` opcional, default `claude-haiku-4-5-20251001`

## Smoke tests con usuario Telefónica
Usuario: `<email-candidato-telefonica>` (tenant `telefonica`)

### Página /ayuda
- [ ] Login → navegar a Sidebar → "Manual de uso" → llega a `/ayuda`
- [ ] El manual carga (no error 404 del .md)
- [ ] TOC lateral visible en desktop
- [ ] Click en "Módulo 5: Prepara tu Entrevista" → scrollea
- [ ] Buscar "interview" o "entrevista" → resultados → click → scrollea
- [ ] Abrir `/ayuda#modulo-3-cv-vs-vacante` directo → scrollea automáticamente

### Bot Modo Manual
- [ ] Abrir chat → toggle "Manual" → mensaje inicial "📖 Modo manual activado"
- [ ] Preguntar "¿Dónde guardo mi CV?" → respuesta + cita "Módulo 6: Mis Documentos"
- [ ] Click en la cita → navega a `/ayuda#modulo-6-mis-documentos` y scrollea
- [ ] Preguntar "¿Cuánto cuestan los planes Pro?" (no aplica a B2B) → respuesta omite mención de precios B2C o dice "no encuentro esto en el manual"
- [ ] Preguntar "¿Quién es el presidente de México?" → "No encuentro esto en el manual" + botón "Hablar con un mentor"
- [ ] Volver a modo "General" → reset conversación → bot responde con DeepSeek normal
- [ ] Verificar contador "X/20 mensajes" funciona y avisa al llegar al 80%

### Rate limit
- [ ] Disparar 11 preguntas rápidas → la 11a devuelve "Estás preguntando muy rápido"
- [ ] (Manual / opcional) Verificar que tras 1 min se desbloquea

### Telemetría
- [ ] Tabla `user_events` (Supabase) muestra `bot_ayuda_query`, `bot_ayuda_reply`, `manual_open`
- [ ] CohortTab admin (Mario/Vanessa) ve los eventos en tiempo real

## Rollback rápido si algo falla
1. Revertir merge en `main` → Netlify y Railway auto-redeploy a versión anterior
2. O: deshabilitar la ruta `/api/chat/manual` quitando `app.use(...)` en `app.js`
3. El bot vuelve a quedar solo en modo general (DeepSeek) — no se rompe nada existente
