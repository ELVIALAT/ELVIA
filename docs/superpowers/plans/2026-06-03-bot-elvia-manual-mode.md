# Bot ELVIA — Modo Manual (Manual-grounded Assistant) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Entregar para esta semana (pruebas Telefónica) un manual de uso navegable dentro de la app autenticada (`/ayuda`) y un "Modo Manual" del Bot ELVIA que responde preguntas usando exclusivamente el manual, con citas obligatorias a la sección, usando Claude Haiku 4.5 con prompt caching (sin RAG vectorial todavía).

**Architecture:** Mono-fuente de verdad: `docs/manual/manual-elvia.md` (markdown con anclas H2/H3 estables). Frontend `/ayuda` renderiza el markdown con TOC + buscador fuse.js, accesible solo con autenticación. Backend agrega ruta nueva `POST /api/chat/manual` (independiente del `/api/chat` actual con DeepSeek) que llama a `claudeService.responderConManual()` con el manual completo como `system` cacheado (`cache_control: ephemeral`). El bot existente (`AiChatBot.jsx`) gana un toggle "📖 Sobre cómo usar ELVIA" que enruta al endpoint nuevo. Cada respuesta cita la sección (`§MÓDULO 3: CV VS VACANTE`) con un link interno a `/ayuda#modulo-3-cv-vs-vacante`. Filtro B2B vía instrucción en system prompt según `req.user.company_id` (Opción A: un solo manual).

**Tech Stack:** React + react-markdown + fuse.js (frontend), Express + @anthropic-ai/sdk con prompt caching (backend), Supabase Auth (auth ya existe), useTrackEvent (telemetría ya existe).

---

## File Structure

**Crear:**
- `docs/manual/manual-elvia.md` — manual canónico en markdown con anclas estables; copia/conversión desde `MANUAL DE USO — PLATAFORMA ELVIA.txt`.
- `backend/src/lib/loadManual.js` — lector síncrono del manual con cache en memoria al boot.
- `backend/src/services/claudeManualService.js` — wrapper Anthropic Haiku 4.5 con prompt caching del manual completo.
- `backend/src/controllers/manualChatController.js` — handler del endpoint, filtrado B2B, output con citas.
- `backend/src/middleware/manualChatLimit.js` — rate limit 20/día y 10/min por usuario (Telefónica-friendly).
- `backend/tests/manualChat.test.js` — tests del controller y del loader.
- `frontend/src/pages/Ayuda.jsx` — página `/ayuda` con TOC, buscador y renderizado markdown.
- `frontend/src/components/help/ManualToc.jsx` — TOC lateral con scroll-spy.
- `frontend/src/components/help/ManualSearch.jsx` — buscador fuse.js sobre secciones.
- `frontend/src/utils/parseManual.js` — parser de markdown → estructura `{ id, title, level, content }`.
- `frontend/public/manual/manual-elvia.md` — copia del manual servida estáticamente al frontend.
- `scripts/sync-manual.js` — script Node que copia `docs/manual/manual-elvia.md` a `frontend/public/manual/manual-elvia.md` y `backend/data/manual-elvia.md`.

**Modificar:**
- `backend/src/app.js` — registrar `routes/manualChat.js`.
- `backend/src/routes/manualChat.js` — nuevo router (crear).
- `frontend/src/App.jsx` — agregar `/ayuda` al router lazy y a `RUTAS_APP`.
- `frontend/src/hooks/useChat.js` — agregar modo `manual` que cambia el endpoint.
- `frontend/src/components/chat/AiChatBot.jsx` — toggle "📖 Modo manual" + render de citas.
- `frontend/src/components/common/Sidebar.jsx` — link a `/ayuda`.

---

## Task 1: Convertir el manual TXT a markdown canónico con anclas

**Files:**
- Create: `docs/manual/manual-elvia.md`

- [ ] **Step 1: Crear directorio `docs/manual/`**

```bash
mkdir -p "docs/manual"
```

- [ ] **Step 2: Crear `docs/manual/manual-elvia.md` con frontmatter + estructura jerárquica**

El archivo destino tiene el contenido íntegro del manual TXT pero como markdown con headings H1/H2/H3 que coincidan con las anclas que renderiza GitHub-flavored markdown (`#nombre-en-kebab-case`). Encabezado del archivo:

```markdown
---
title: "Manual de Uso — Plataforma ELVIA"
version: "Junio 2026"
audience: "Usuarios autenticados de la plataforma ELVIA"
last_updated: "2026-06-03"
---

# Manual de Uso — Plataforma ELVIA

> Documento oficial de uso para usuarios autenticados. Este manual es la fuente de verdad del Bot ELVIA cuando responde preguntas sobre cómo usar la plataforma.

## Tabla de contenidos

- [Módulo 1: Autoconocimiento](#modulo-1-autoconocimiento)
  - [1.1 Mi Perfil](#11-mi-perfil)
  - [1.2 Competencias](#12-competencias)
  - [1.3 Gastos](#13-gastos)
  - [1.4 Horario Semanal](#14-horario-semanal)
  - [1.5 Mi Oferta de Valor](#15-mi-oferta-de-valor)
  - [1.6 Optimizador de CV](#16-optimizador-de-cv)
- [Módulo 2: LinkedIn® Pro](#modulo-2-linkedin-pro)
- [Módulo 3: CV vs Vacante](#modulo-3-cv-vs-vacante)
- [Módulo 4: Buscar Vacantes](#modulo-4-buscar-vacantes)
- [Módulo 5: Prepara tu Entrevista](#modulo-5-prepara-tu-entrevista)
- [Módulo 6: Mis Documentos](#modulo-6-mis-documentos)
- [Módulo 7: Mis Vacantes](#modulo-7-mis-vacantes)
- [Módulo 8: Pipeline](#modulo-8-pipeline)
- [Módulo 9: Mis Métricas](#modulo-9-mis-metricas)
- [Preguntas Frecuentes Generales](#preguntas-frecuentes-generales)

---

## Módulo 1: Autoconocimiento

[contenido literal del TXT, sección Módulo 1, preservando todas las preguntas `¿…?` como sub-headings H3]

### ¿Qué es el módulo de Autoconocimiento?

El módulo de Autoconocimiento es el punto de partida...

[continúa con cada pregunta como H3]

### 1.1 Mi Perfil

[contenido]

[… repetir para todos los módulos y la sección de FAQ]
```

Reglas estrictas de conversión:
1. Cada módulo principal usa `##` con título exacto `Módulo N: NOMBRE` (sin guiones bajos, sin asterisk).
2. Cada subsección (1.1, 1.2, etc.) usa `###` con título exacto `N.M Nombre`.
3. Cada pregunta `¿…?` del TXT se convierte en `### ¿…?` dentro del módulo correspondiente.
4. Listas con `•` del TXT se convierten a listas markdown con `-`.
5. NO se altera el contenido factual: porcentajes, números (50, 700, 75%, 100%), nombres de campos, ni textos entre comillas.
6. Las anclas resultantes deben ser kebab-case: `modulo-1-autoconocimiento`, `11-mi-perfil`, `que-es-mi-perfil`, etc. (verificar manualmente con un previewer markdown).

- [ ] **Step 3: Validar manualmente las anclas**

Abrir el archivo con un previewer markdown (VSCode `Ctrl+Shift+V`). Hacer click en cada entrada del TOC. Cada link debe llevar a la sección correcta. Si alguna ancla no coincide, ajustar el slug del heading.

- [ ] **Step 4: Commit**

```bash
git add docs/manual/manual-elvia.md
git commit -m "docs(manual): convertir manual TXT a markdown canonico para Bot ELVIA"
```

---

## Task 2: Script de sincronización del manual a frontend/backend

**Files:**
- Create: `scripts/sync-manual.js`
- Modify: `package.json` (raíz) — agregar script `manual:sync`

- [ ] **Step 1: Crear `scripts/sync-manual.js`**

```javascript
// scripts/sync-manual.js
// Copia docs/manual/manual-elvia.md a:
//   - frontend/public/manual/manual-elvia.md  (servido al cliente)
//   - backend/data/manual-elvia.md            (cargado en memoria al boot)
// Uso: node scripts/sync-manual.js
// Hook: ejecutar antes de cada build (predeploy) y antes de commit cuando se edita el manual.

const fs = require('fs');
const path = require('path');

const SOURCE = path.join(__dirname, '..', 'docs', 'manual', 'manual-elvia.md');
const TARGETS = [
  path.join(__dirname, '..', 'frontend', 'public', 'manual', 'manual-elvia.md'),
  path.join(__dirname, '..', 'backend', 'data', 'manual-elvia.md'),
];

function main() {
  if (!fs.existsSync(SOURCE)) {
    console.error(`[sync-manual] Source not found: ${SOURCE}`);
    process.exit(1);
  }
  const content = fs.readFileSync(SOURCE, 'utf8');
  for (const target of TARGETS) {
    fs.mkdirSync(path.dirname(target), { recursive: true });
    fs.writeFileSync(target, content, 'utf8');
    console.log(`[sync-manual] ${target} (${content.length} chars)`);
  }
  console.log('[sync-manual] Done');
}

main();
```

- [ ] **Step 2: Agregar script al `package.json` raíz**

Ubicar el `package.json` raíz del repo y agregar dentro de `"scripts"`:

```json
{
  "scripts": {
    "manual:sync": "node scripts/sync-manual.js"
  }
}
```

Si no existe `package.json` en la raíz, agregar el script al `package.json` del backend (`backend/package.json`) ajustando la ruta a `node ../scripts/sync-manual.js`.

- [ ] **Step 3: Ejecutar el script y verificar**

```bash
node scripts/sync-manual.js
```

Salida esperada:

```
[sync-manual] .../frontend/public/manual/manual-elvia.md (XXXXX chars)
[sync-manual] .../backend/data/manual-elvia.md (XXXXX chars)
[sync-manual] Done
```

Verificar que `frontend/public/manual/manual-elvia.md` y `backend/data/manual-elvia.md` existen y tienen el mismo contenido que la fuente.

- [ ] **Step 4: Commit**

```bash
git add scripts/sync-manual.js package.json frontend/public/manual/manual-elvia.md backend/data/manual-elvia.md
git commit -m "feat(manual): script de sincronizacion del manual a frontend/backend"
```

---

## Task 3: Backend — loader del manual con cache en memoria

**Files:**
- Create: `backend/src/lib/loadManual.js`
- Test: `backend/tests/loadManual.test.js`

- [ ] **Step 1: Crear test que falle**

```javascript
// backend/tests/loadManual.test.js
const { loadManual, getManualText, getManualSections } = require('../src/lib/loadManual');

describe('loadManual', () => {
  test('carga el manual desde backend/data/manual-elvia.md', () => {
    loadManual();
    const text = getManualText();
    expect(text).toContain('Manual de Uso — Plataforma ELVIA');
    expect(text.length).toBeGreaterThan(5000);
  });

  test('expone las secciones principales con sus anclas', () => {
    loadManual();
    const sections = getManualSections();
    const titles = sections.map(s => s.title);
    expect(titles).toContain('Módulo 1: Autoconocimiento');
    expect(titles).toContain('Módulo 3: CV vs Vacante');
    expect(titles).toContain('Módulo 9: Mis Métricas');
    // Cada sección debe tener ancla kebab-case
    const moduloAutoconocimiento = sections.find(s => s.title === 'Módulo 1: Autoconocimiento');
    expect(moduloAutoconocimiento.anchor).toBe('modulo-1-autoconocimiento');
  });

  test('lanza error claro si el archivo no existe', () => {
    // Forzar ruta inexistente con env var
    const originalPath = process.env.MANUAL_PATH;
    process.env.MANUAL_PATH = '/tmp/no-existe.md';
    expect(() => loadManual({ force: true })).toThrow(/manual-elvia\.md/);
    process.env.MANUAL_PATH = originalPath;
  });
});
```

- [ ] **Step 2: Correr el test y verificar que falla**

```bash
cd backend
npx jest tests/loadManual.test.js
```

Esperado: FAIL `Cannot find module '../src/lib/loadManual'`.

- [ ] **Step 3: Crear `backend/src/lib/loadManual.js`**

```javascript
// backend/src/lib/loadManual.js
// Carga el manual ELVIA en memoria al boot y expone helpers para leer texto y secciones.
// El manual es ~10K tokens; cabe holgadamente en RAM (~30KB).
const fs = require('fs');
const path = require('path');

const DEFAULT_PATH = path.join(__dirname, '..', '..', 'data', 'manual-elvia.md');

let _cache = null;

function _slug(title) {
  return title
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '') // remove accents
    .replace(/[®©™]/g, '')
    .replace(/[^a-z0-9\s-]/g, '')
    .trim()
    .replace(/\s+/g, '-');
}

function _parseSections(text) {
  const lines = text.split('\n');
  const sections = [];
  for (let i = 0; i < lines.length; i++) {
    const m = lines[i].match(/^(#{2,3})\s+(.+)$/);
    if (!m) continue;
    const level = m[1].length;
    const title = m[2].trim();
    sections.push({ title, level, anchor: _slug(title), lineStart: i });
  }
  return sections;
}

function loadManual(opts = {}) {
  if (_cache && !opts.force) return _cache;
  const manualPath = process.env.MANUAL_PATH || DEFAULT_PATH;
  if (!fs.existsSync(manualPath)) {
    throw new Error(`[loadManual] manual-elvia.md no encontrado en ${manualPath}. Ejecuta "node scripts/sync-manual.js".`);
  }
  const text = fs.readFileSync(manualPath, 'utf8');
  _cache = {
    text,
    sections: _parseSections(text),
    loadedAt: Date.now(),
    path: manualPath,
  };
  console.log(`[loadManual] OK — ${text.length} chars, ${_cache.sections.length} secciones desde ${manualPath}`);
  return _cache;
}

function getManualText() {
  if (!_cache) loadManual();
  return _cache.text;
}

function getManualSections() {
  if (!_cache) loadManual();
  return _cache.sections;
}

module.exports = { loadManual, getManualText, getManualSections };
```

- [ ] **Step 4: Correr el test y verificar que pasa**

```bash
cd backend
npx jest tests/loadManual.test.js
```

Esperado: PASS (3 tests).

- [ ] **Step 5: Cargar el manual al boot en `app.js`**

Editar `backend/src/app.js` agregando cerca de los otros `require` iniciales (después de los imports, antes de definir las rutas):

```javascript
// Carga el manual ELVIA al boot — falla rápido si falta el archivo
require('./lib/loadManual').loadManual();
```

- [ ] **Step 6: Verificar boot sin errores**

```bash
cd backend
node src/app.js
```

Esperado en stdout:

```
[loadManual] OK — XXXXX chars, NN secciones desde .../backend/data/manual-elvia.md
```

Detener con `Ctrl+C`.

- [ ] **Step 7: Commit**

```bash
git add backend/src/lib/loadManual.js backend/tests/loadManual.test.js backend/src/app.js
git commit -m "feat(manual): loader del manual con cache en memoria + boot validation"
```

---

## Task 4: Backend — Claude service con prompt caching del manual

**Files:**
- Create: `backend/src/services/claudeManualService.js`
- Test: `backend/tests/claudeManualService.test.js`

- [ ] **Step 1: Crear test que falle (mock del cliente Anthropic)**

```javascript
// backend/tests/claudeManualService.test.js
jest.mock('@anthropic-ai/sdk');

const Anthropic = require('@anthropic-ai/sdk');
const mockCreate = jest.fn();
Anthropic.mockImplementation(() => ({ messages: { create: mockCreate } }));

// Forzar API key para no abortar el init
process.env.ANTHROPIC_API_KEY = 'test-key';
process.env.MANUAL_PATH = require('path').join(__dirname, '..', 'data', 'manual-elvia.md');

const { responderConManual } = require('../src/services/claudeManualService');

describe('claudeManualService.responderConManual', () => {
  beforeEach(() => { mockCreate.mockReset(); });

  test('llama a Claude Haiku con system prompt cacheado', async () => {
    mockCreate.mockResolvedValue({
      content: [{ text: JSON.stringify({
        respuesta: 'Para guardar tu CV ve a Mis Documentos.',
        citas: [{ seccion: 'Módulo 6: Mis Documentos', anchor: 'modulo-6-mis-documentos' }],
        requiere_escalamiento: false
      }) }]
    });

    const out = await responderConManual({
      question: '¿Dónde veo mi CV?',
      userContext: { isB2B: false, tenantSlug: null }
    });

    expect(mockCreate).toHaveBeenCalledTimes(1);
    const call = mockCreate.mock.calls[0][0];
    expect(call.model).toMatch(/haiku/);
    // system es un array con cache_control en el bloque del manual
    expect(Array.isArray(call.system)).toBe(true);
    const manualBlock = call.system.find(b => b.text && b.text.includes('Manual de Uso'));
    expect(manualBlock.cache_control).toEqual({ type: 'ephemeral' });
    expect(out.respuesta).toContain('Mis Documentos');
    expect(out.citas).toHaveLength(1);
  });

  test('inyecta instruccion B2B Telefonica cuando isB2B=true', async () => {
    mockCreate.mockResolvedValue({
      content: [{ text: JSON.stringify({
        respuesta: 'ok',
        citas: [],
        requiere_escalamiento: false
      }) }]
    });

    await responderConManual({
      question: 'test',
      userContext: { isB2B: true, tenantSlug: 'telefonica' }
    });

    const call = mockCreate.mock.calls[0][0];
    const sysText = call.system.map(b => b.text).join('\n');
    expect(sysText).toMatch(/B2B/);
    expect(sysText).toMatch(/telefonica/i);
    // No debe mencionar limite demo (10 generaciones) para B2B
    expect(sysText).toMatch(/Omite menciones a limites de cuenta demo/);
  });

  test('si Claude devuelve texto no-JSON, retorna respuesta cruda con citas vacias', async () => {
    mockCreate.mockResolvedValue({
      content: [{ text: 'Respuesta plana sin JSON.' }]
    });

    const out = await responderConManual({
      question: 'test',
      userContext: { isB2B: false }
    });

    expect(out.respuesta).toBe('Respuesta plana sin JSON.');
    expect(out.citas).toEqual([]);
    expect(out.requiere_escalamiento).toBe(false);
  });
});
```

- [ ] **Step 2: Correr el test y verificar que falla**

```bash
cd backend
npx jest tests/claudeManualService.test.js
```

Esperado: FAIL `Cannot find module '../src/services/claudeManualService'`.

- [ ] **Step 3: Crear `backend/src/services/claudeManualService.js`**

```javascript
// backend/src/services/claudeManualService.js
// Wrapper de Anthropic Haiku 4.5 con prompt caching del manual ELVIA completo.
// El manual va en el bloque "system" con cache_control:ephemeral → 90% descuento
// a partir de la 2da request del mismo usuario en una ventana de 5 minutos.

const Anthropic = require('@anthropic-ai/sdk');
const { getManualText } = require('../lib/loadManual');

const MODEL = process.env.CLAUDE_MANUAL_MODEL || 'claude-haiku-4-5-20251001';

let client = null;
if (!process.env.ANTHROPIC_API_KEY) {
  console.error('[claudeManualService] ANTHROPIC_API_KEY no configurada — Bot Modo Manual deshabilitado');
} else {
  try { client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY }); }
  catch (e) { console.error('[claudeManualService] init error:', e.message); }
}

const INSTRUCCIONES_BASE = `Eres ELVIA, mentora de carrera 24/7 dentro de la plataforma ELVIA. Estás en "Modo Manual": tu única tarea es responder preguntas del usuario sobre CÓMO USAR la plataforma usando EXCLUSIVAMENTE la información del Manual de Uso que recibes a continuación.

REGLAS NO NEGOCIABLES:
1. CERO INVENCIÓN: Si la respuesta no está literal o claramente derivable del manual, responde "No encuentro esto en el manual oficial. Te conecto con un mentor experto para que te ayude." y marca requiere_escalamiento=true.
2. CITAS OBLIGATORIAS: Toda respuesta debe citar la(s) sección(es) del manual de donde sale la información, usando exactamente el título del heading (ej. "Módulo 6: Mis Documentos" o "1.5 Mi Oferta de Valor"). Si no puedes citar, no respondas — escala.
3. TONO ELVIA: Español neutro hispanoamericano, cercano pero profesional, sin frialdad corporativa. NUNCA digas "IA" — usa "ELVIA" o "yo". Eres mentora, no asistente robótico.
4. CONFIDENCIALIDAD: Si el usuario pide subir CVs de terceros u operar con datos que no son suyos, niégate citando la nota del manual sobre tratamiento de datos.
5. FORMATO DE SALIDA: Responde SIEMPRE en JSON puro con esta estructura exacta:
{
  "respuesta": "texto markdown de máximo 250 palabras, cercano y accionable",
  "citas": [{"seccion": "título exacto del heading H2 o H3", "anchor": "kebab-case-del-heading"}],
  "requiere_escalamiento": false
}
6. LONGITUD: máximo 250 palabras en la respuesta. Si la pregunta cubre varios temas, prioriza el más directo y sugiere abrir el manual en /ayuda para profundizar.`;

function buildContextBlock(userContext) {
  const lines = [];
  if (userContext?.isB2B) {
    lines.push(`Este usuario es B2B${userContext.tenantSlug ? ` (tenant: ${userContext.tenantSlug})` : ''}.`);
    lines.push('Omite menciones a limites de cuenta demo (ej. "10 generaciones"), planes B2C individuales, o precios Pricing.');
    lines.push('No menciones funciones que no aplican a su contrato corporativo.');
  } else {
    lines.push('Este usuario es B2C individual. Puedes mencionar todas las funciones documentadas en el manual.');
  }
  return lines.join('\n');
}

async function responderConManual({ question, userContext = {}, history = [] }) {
  if (!client) {
    return {
      respuesta: 'Modo Manual no disponible temporalmente. Intenta más tarde.',
      citas: [],
      requiere_escalamiento: true,
    };
  }

  const manualText = getManualText();
  const contextBlock = buildContextBlock(userContext);

  // System en bloques: instrucciones (no cacheadas) + manual (cacheado) + contexto usuario (no cacheado, pequeño)
  const system = [
    { type: 'text', text: INSTRUCCIONES_BASE },
    {
      type: 'text',
      text: `MANUAL DE USO — PLATAFORMA ELVIA (fuente única de verdad):\n\n${manualText}`,
      cache_control: { type: 'ephemeral' },
    },
    { type: 'text', text: `CONTEXTO DEL USUARIO ACTUAL:\n${contextBlock}` },
  ];

  // Historial breve (máx 6 turnos) sin contaminar el cache
  const recentHistory = (history || []).slice(-6).map(m => ({
    role: m.role === 'assistant' ? 'assistant' : 'user',
    content: String(m.content || '').slice(0, 1500),
  }));

  const messages = [
    ...recentHistory,
    { role: 'user', content: question },
  ];

  let response;
  try {
    response = await client.messages.create({
      model: MODEL,
      max_tokens: 800,
      temperature: 0.2,
      system,
      messages,
    });
  } catch (err) {
    console.error('[claudeManualService] Anthropic error:', err.message);
    return {
      respuesta: 'Tuve un problema técnico al consultar el manual. Intenta de nuevo en un momento.',
      citas: [],
      requiere_escalamiento: true,
    };
  }

  const raw = response.content?.[0]?.text || '';
  try {
    const parsed = JSON.parse(raw);
    return {
      respuesta: String(parsed.respuesta || raw),
      citas: Array.isArray(parsed.citas) ? parsed.citas : [],
      requiere_escalamiento: Boolean(parsed.requiere_escalamiento),
      _usage: response.usage || null,
    };
  } catch (_e) {
    // Fallback: si Claude no respeta el formato JSON, devolvemos el texto plano
    return {
      respuesta: raw,
      citas: [],
      requiere_escalamiento: false,
      _usage: response.usage || null,
    };
  }
}

module.exports = { responderConManual };
```

- [ ] **Step 4: Correr el test y verificar que pasa**

```bash
cd backend
npx jest tests/claudeManualService.test.js
```

Esperado: PASS (3 tests).

- [ ] **Step 5: Commit**

```bash
git add backend/src/services/claudeManualService.js backend/tests/claudeManualService.test.js
git commit -m "feat(manual): claude-haiku-4-5 service con prompt caching del manual ELVIA"
```

---

## Task 5: Backend — middleware de rate limiting específico para Modo Manual

**Files:**
- Create: `backend/src/middleware/manualChatLimit.js`
- Test: `backend/tests/manualChatLimit.test.js`

- [ ] **Step 1: Crear test que falle**

```javascript
// backend/tests/manualChatLimit.test.js
const manualChatLimit = require('../src/middleware/manualChatLimit');

function mockReqRes(userId) {
  const req = { user: { id: userId } };
  const status = jest.fn(() => ({ json: jest.fn() }));
  const res = { status };
  const next = jest.fn();
  return { req, res, next, status };
}

describe('manualChatLimit', () => {
  beforeEach(() => {
    // Reset interno: forzar reload del módulo para limpiar mapa
    jest.resetModules();
  });

  test('permite hasta 10 peticiones en 60s', () => {
    const limit = require('../src/middleware/manualChatLimit');
    for (let i = 0; i < 10; i++) {
      const { req, res, next } = mockReqRes('user-A');
      limit(req, res, next);
      expect(next).toHaveBeenCalled();
    }
  });

  test('bloquea la 11a peticion en 60s con 429', () => {
    const limit = require('../src/middleware/manualChatLimit');
    for (let i = 0; i < 10; i++) {
      const { req, res, next } = mockReqRes('user-B');
      limit(req, res, next);
    }
    const { req, res, next, status } = mockReqRes('user-B');
    limit(req, res, next);
    expect(status).toHaveBeenCalledWith(429);
    expect(next).not.toHaveBeenCalled();
  });

  test('bloquea con 429 al pasar 20 peticiones en 24h', () => {
    const limit = require('../src/middleware/manualChatLimit');
    for (let i = 0; i < 20; i++) {
      const { req, res, next } = mockReqRes('user-C');
      limit(req, res, next);
      // Avanzar el reloj 6 min entre peticiones para no chocar con el limite por minuto
      jest.advanceTimersByTime ? jest.advanceTimersByTime(6 * 60 * 1000) : null;
    }
    const { req, res, next, status } = mockReqRes('user-C');
    limit(req, res, next);
    expect(status).toHaveBeenCalledWith(429);
    expect(next).not.toHaveBeenCalled();
  });

  test('rechaza si no hay req.user.id', () => {
    const limit = require('../src/middleware/manualChatLimit');
    const req = {};
    const status = jest.fn(() => ({ json: jest.fn() }));
    const res = { status };
    const next = jest.fn();
    limit(req, res, next);
    expect(status).toHaveBeenCalledWith(401);
    expect(next).not.toHaveBeenCalled();
  });
});
```

Nota: el 3er test usa timers; si jest no está configurado con fake timers, comentarlo y dejar solo los 3 otros (la lógica de 24h se valida manualmente).

- [ ] **Step 2: Correr el test y verificar que falla**

```bash
cd backend
npx jest tests/manualChatLimit.test.js
```

Esperado: FAIL `Cannot find module`.

- [ ] **Step 3: Crear `backend/src/middleware/manualChatLimit.js`**

```javascript
// backend/src/middleware/manualChatLimit.js
// Doble límite: 10/minuto y 20/día por usuario.
// In-memory, suficiente para esta semana (1 instancia Railway). Migrar a Redis si escala.

const minuteWindow = new Map(); // userId -> { count, firstAt }
const dayWindow = new Map();    // userId -> { count, firstAt }

const MAX_PER_MINUTE = 10;
const MAX_PER_DAY = 20;
const MIN_WINDOW = 60 * 1000;
const DAY_WINDOW = 24 * 60 * 60 * 1000;

function bumpWindow(map, userId, windowMs) {
  const now = Date.now();
  const entry = map.get(userId) || { count: 0, firstAt: now };
  if (now - entry.firstAt > windowMs) {
    entry.count = 1;
    entry.firstAt = now;
  } else {
    entry.count += 1;
  }
  map.set(userId, entry);
  return entry;
}

function manualChatLimit(req, res, next) {
  const userId = req.user?.id;
  if (!userId) {
    return res.status(401).json({ error: 'No autorizado' });
  }

  const minute = bumpWindow(minuteWindow, userId, MIN_WINDOW);
  if (minute.count > MAX_PER_MINUTE) {
    return res.status(429).json({
      error: 'RATE_LIMIT_MINUTE',
      reply: 'Estás preguntando muy rápido. Espera 1 minuto y vuelve a intentarlo.',
    });
  }

  const day = bumpWindow(dayWindow, userId, DAY_WINDOW);
  if (day.count > MAX_PER_DAY) {
    return res.status(429).json({
      error: 'RATE_LIMIT_DAY',
      reply: `Llegaste al máximo diario de ${MAX_PER_DAY} consultas al manual. Vuelve mañana o consulta a un mentor experto.`,
    });
  }

  next();
}

module.exports = manualChatLimit;
```

- [ ] **Step 4: Correr el test y verificar que pasa**

```bash
cd backend
npx jest tests/manualChatLimit.test.js
```

Esperado: PASS (al menos 3 tests; el de timers puede skip si la config jest no tiene fake timers).

- [ ] **Step 5: Commit**

```bash
git add backend/src/middleware/manualChatLimit.js backend/tests/manualChatLimit.test.js
git commit -m "feat(manual): rate limit 10/min + 20/dia para Bot Modo Manual"
```

---

## Task 6: Backend — controller + ruta `/api/chat/manual`

**Files:**
- Create: `backend/src/controllers/manualChatController.js`
- Create: `backend/src/routes/manualChat.js`
- Modify: `backend/src/app.js`
- Test: `backend/tests/manualChatController.test.js`

- [ ] **Step 1: Crear test del controller**

```javascript
// backend/tests/manualChatController.test.js
jest.mock('../src/services/claudeManualService', () => ({
  responderConManual: jest.fn(),
}));

const { responderConManual } = require('../src/services/claudeManualService');
const { handleManualChat } = require('../src/controllers/manualChatController');

function mockReqRes(body, user) {
  const req = { body, user };
  const res = { json: jest.fn(), status: jest.fn().mockReturnThis() };
  const next = jest.fn();
  return { req, res, next };
}

describe('handleManualChat', () => {
  beforeEach(() => responderConManual.mockReset());

  test('400 si message vacio', async () => {
    const { req, res, next } = mockReqRes({}, { id: 'u1' });
    await handleManualChat(req, res, next);
    expect(res.status).toHaveBeenCalledWith(400);
  });

  test('400 si message > 1000 chars', async () => {
    const long = 'a'.repeat(1001);
    const { req, res, next } = mockReqRes({ message: long }, { id: 'u1' });
    await handleManualChat(req, res, next);
    expect(res.status).toHaveBeenCalledWith(400);
  });

  test('pasa company_id al userContext y devuelve respuesta del service', async () => {
    responderConManual.mockResolvedValue({
      respuesta: 'Test ok',
      citas: [{ seccion: 'Módulo 1', anchor: 'modulo-1' }],
      requiere_escalamiento: false,
    });
    const { req, res } = mockReqRes(
      { message: '¿dónde encuentro mi CV?' },
      { id: 'u1', company_id: 'tel-uuid', tenant_slug: 'telefonica' }
    );
    await handleManualChat(req, res, jest.fn());
    const args = responderConManual.mock.calls[0][0];
    expect(args.userContext.isB2B).toBe(true);
    expect(args.userContext.tenantSlug).toBe('telefonica');
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
      reply: 'Test ok',
      citas: [{ seccion: 'Módulo 1', anchor: 'modulo-1' }],
      requiere_escalamiento: false,
    }));
  });
});
```

- [ ] **Step 2: Correr y verificar fallo**

```bash
cd backend
npx jest tests/manualChatController.test.js
```

Esperado: FAIL `Cannot find module`.

- [ ] **Step 3: Crear `backend/src/controllers/manualChatController.js`**

```javascript
// backend/src/controllers/manualChatController.js
const { responderConManual } = require('../services/claudeManualService');

async function handleManualChat(req, res, next) {
  try {
    const { message, history } = req.body || {};

    if (!message || typeof message !== 'string' || message.trim().length === 0) {
      return res.status(400).json({ error: 'El campo message es requerido' });
    }
    if (message.length > 1000) {
      return res.status(400).json({ error: 'Mensaje demasiado largo (máximo 1000 caracteres)' });
    }

    const userContext = {
      isB2B: Boolean(req.user?.company_id),
      tenantSlug: req.user?.tenant_slug || null,
      userId: req.user?.id || null,
    };

    const result = await responderConManual({
      question: message.trim(),
      userContext,
      history: Array.isArray(history) ? history.slice(-6) : [],
    });

    return res.json({
      reply: result.respuesta,
      citas: result.citas,
      requiere_escalamiento: result.requiere_escalamiento,
    });
  } catch (err) {
    next(err);
  }
}

module.exports = { handleManualChat };
```

- [ ] **Step 4: Crear `backend/src/routes/manualChat.js`**

```javascript
// backend/src/routes/manualChat.js
const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const manualChatLimit = require('../middleware/manualChatLimit');
const { handleManualChat } = require('../controllers/manualChatController');

// POST /api/chat/manual — Bot ELVIA en Modo Manual (responde solo con el manual)
router.post('/', auth, manualChatLimit, handleManualChat);

module.exports = router;
```

- [ ] **Step 5: Registrar la ruta en `backend/src/app.js`**

Localizar la sección donde se montan otras rutas (ej. `app.use('/api/chat', ...)`) y agregar la línea nueva debajo:

```javascript
app.use('/api/chat/manual', require('./routes/manualChat'));
```

IMPORTANTE: registrar antes del catch-all 404 si existe, y después del montaje de `/api/chat` para que la ruta más específica no quede sombreada.

- [ ] **Step 6: Verificar test pasa**

```bash
cd backend
npx jest tests/manualChatController.test.js
```

Esperado: PASS (3 tests).

- [ ] **Step 7: Smoke test manual con curl**

Arrancar el backend:

```bash
cd backend && node src/app.js
```

En otra terminal (reemplazar `<TOKEN>` por un JWT válido de Supabase):

```bash
curl -X POST http://localhost:3000/api/chat/manual \
  -H "Authorization: Bearer <TOKEN>" \
  -H "Content-Type: application/json" \
  -d '{"message":"¿Dónde encuentro mi CV generado?"}'
```

Esperado: respuesta JSON con `reply`, `citas`, `requiere_escalamiento`. La cita debe ser `Módulo 6: Mis Documentos`.

- [ ] **Step 8: Commit**

```bash
git add backend/src/controllers/manualChatController.js backend/src/routes/manualChat.js backend/src/app.js backend/tests/manualChatController.test.js
git commit -m "feat(manual): endpoint POST /api/chat/manual con auth, rate limit y citas"
```

---

## Task 7: Frontend — utilidad para parsear el manual markdown

**Files:**
- Create: `frontend/src/utils/parseManual.js`
- Test: `frontend/src/utils/parseManual.test.js`

- [ ] **Step 1: Crear test**

```javascript
// frontend/src/utils/parseManual.test.js
import { describe, test, expect } from 'vitest';
import { parseManualSections, slugify } from './parseManual';

const SAMPLE = `# Manual

## Módulo 1: Autoconocimiento

Intro del modulo.

### ¿Qué es el módulo?

Respuesta.

## Módulo 2: LinkedIn® Pro

Otra cosa.`;

describe('parseManual', () => {
  test('slugify quita acentos y simbolos', () => {
    expect(slugify('Módulo 3: CV vs Vacante')).toBe('modulo-3-cv-vs-vacante');
    expect(slugify('LinkedIn® Pro')).toBe('linkedin-pro');
    expect(slugify('1.1 Mi Perfil')).toBe('11-mi-perfil');
  });

  test('parseManualSections extrae H2 y H3 con anclas', () => {
    const sections = parseManualSections(SAMPLE);
    expect(sections).toHaveLength(3);
    expect(sections[0]).toMatchObject({ level: 2, title: 'Módulo 1: Autoconocimiento', anchor: 'modulo-1-autoconocimiento' });
    expect(sections[1]).toMatchObject({ level: 3, title: '¿Qué es el módulo?' });
    expect(sections[2]).toMatchObject({ level: 2, title: 'Módulo 2: LinkedIn® Pro', anchor: 'modulo-2-linkedin-pro' });
  });
});
```

- [ ] **Step 2: Verificar fallo**

```bash
cd frontend
npx vitest run src/utils/parseManual.test.js
```

Esperado: FAIL `Cannot find module`.

- [ ] **Step 3: Crear `frontend/src/utils/parseManual.js`**

```javascript
// frontend/src/utils/parseManual.js
// Parser ligero del manual ELVIA para alimentar TOC y buscador fuse.js.

export function slugify(text) {
  return String(text || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[®©™]/g, '')
    .replace(/[^a-z0-9\s-]/g, '')
    .trim()
    .replace(/\s+/g, '-');
}

export function parseManualSections(markdown) {
  if (!markdown) return [];
  const lines = markdown.split('\n');
  const sections = [];
  let current = null;
  for (let i = 0; i < lines.length; i++) {
    const m = lines[i].match(/^(#{2,3})\s+(.+)$/);
    if (m) {
      if (current) sections.push(current);
      current = {
        level: m[1].length,
        title: m[2].trim(),
        anchor: slugify(m[2].trim()),
        body: [],
      };
    } else if (current) {
      current.body.push(lines[i]);
    }
  }
  if (current) sections.push(current);
  return sections.map(s => ({ ...s, body: s.body.join('\n').trim() }));
}
```

- [ ] **Step 4: Verificar test pasa**

```bash
cd frontend
npx vitest run src/utils/parseManual.test.js
```

Esperado: PASS (2 tests).

- [ ] **Step 5: Commit**

```bash
git add frontend/src/utils/parseManual.js frontend/src/utils/parseManual.test.js
git commit -m "feat(manual): util parseManual para TOC y buscador"
```

---

## Task 8: Frontend — instalar fuse.js + componente buscador

**Files:**
- Modify: `frontend/package.json`
- Create: `frontend/src/components/help/ManualSearch.jsx`

- [ ] **Step 1: Instalar fuse.js**

```bash
cd frontend
npm install fuse.js@7
```

- [ ] **Step 2: Crear `frontend/src/components/help/ManualSearch.jsx`**

```jsx
// frontend/src/components/help/ManualSearch.jsx
import { useMemo, useState, useEffect } from 'react';
import Fuse from 'fuse.js';
import { MagnifyingGlass } from '@phosphor-icons/react';

export default function ManualSearch({ sections, onJump }) {
  const [q, setQ] = useState('');
  const fuse = useMemo(() => new Fuse(sections, {
    keys: ['title', 'body'],
    threshold: 0.35,
    ignoreLocation: true,
    minMatchCharLength: 3,
  }), [sections]);

  const [results, setResults] = useState([]);
  useEffect(() => {
    if (q.trim().length < 3) { setResults([]); return; }
    setResults(fuse.search(q).slice(0, 8).map(r => r.item));
  }, [q, fuse]);

  return (
    <div className="relative">
      <div className="flex items-center gap-2 bg-white border border-outline-variant/40 rounded-full px-4 py-2 shadow-sm">
        <MagnifyingGlass size={18} className="text-on-surface-variant" />
        <input
          type="text"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Busca en el manual (ej. cómo guardar CV)"
          className="flex-1 bg-transparent text-sm focus:outline-none"
        />
      </div>

      {results.length > 0 && (
        <ul className="absolute z-20 left-0 right-0 mt-2 bg-white border border-outline-variant/30 rounded-2xl shadow-floatLg max-h-80 overflow-y-auto">
          {results.map((r) => (
            <li key={r.anchor}>
              <button
                type="button"
                onClick={() => { onJump(r.anchor); setQ(''); setResults([]); }}
                className="w-full text-left px-4 py-3 hover:bg-primary/5 border-b border-outline-variant/10 last:border-none"
              >
                <p className="font-semibold text-sm text-on-surface">{r.title}</p>
                <p className="text-xs text-on-surface-variant line-clamp-2">{r.body.slice(0, 140)}…</p>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
```

- [ ] **Step 3: Commit**

```bash
git add frontend/package.json frontend/package-lock.json frontend/src/components/help/ManualSearch.jsx
git commit -m "feat(ayuda): instalar fuse.js + componente buscador del manual"
```

---

## Task 9: Frontend — componente TOC del manual

**Files:**
- Create: `frontend/src/components/help/ManualToc.jsx`

- [ ] **Step 1: Crear `frontend/src/components/help/ManualToc.jsx`**

```jsx
// frontend/src/components/help/ManualToc.jsx
export default function ManualToc({ sections, activeAnchor, onJump }) {
  const h2 = sections.filter(s => s.level === 2);
  return (
    <nav className="sticky top-4 max-h-[calc(100vh-2rem)] overflow-y-auto pr-2">
      <p className="text-[11px] font-bold uppercase tracking-wider text-on-surface-variant mb-3">Contenido</p>
      <ul className="space-y-1">
        {h2.map((s) => {
          const subs = sections.filter(x => x.level === 3 && sectionsBelongTo(sections, x, s));
          const isActive = activeAnchor === s.anchor || subs.some(x => x.anchor === activeAnchor);
          return (
            <li key={s.anchor}>
              <button
                type="button"
                onClick={() => onJump(s.anchor)}
                className={`block w-full text-left text-sm py-1.5 px-2 rounded-lg transition-colors ${isActive ? 'bg-primary/10 text-primary font-semibold' : 'text-on-surface hover:bg-surface-container'}`}
              >
                {s.title}
              </button>
              {isActive && subs.length > 0 && (
                <ul className="ml-3 mt-1 mb-1 space-y-0.5 border-l border-outline-variant/40 pl-2">
                  {subs.slice(0, 8).map(sub => (
                    <li key={sub.anchor}>
                      <button
                        type="button"
                        onClick={() => onJump(sub.anchor)}
                        className={`block w-full text-left text-[12px] py-1 px-1 rounded transition-colors ${activeAnchor === sub.anchor ? 'text-primary font-semibold' : 'text-on-surface-variant hover:text-on-surface'}`}
                      >
                        {sub.title}
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </li>
          );
        })}
      </ul>
    </nav>
  );
}

// Devuelve true si sub aparece DESPUÉS de parent y ANTES del siguiente H2
function sectionsBelongTo(all, sub, parent) {
  const parentIdx = all.findIndex(x => x.anchor === parent.anchor);
  const nextH2Idx = all.findIndex((x, i) => i > parentIdx && x.level === 2);
  const subIdx = all.findIndex(x => x.anchor === sub.anchor);
  if (subIdx <= parentIdx) return false;
  if (nextH2Idx === -1) return true;
  return subIdx < nextH2Idx;
}
```

- [ ] **Step 2: Commit**

```bash
git add frontend/src/components/help/ManualToc.jsx
git commit -m "feat(ayuda): TOC con scroll-spy del manual"
```

---

## Task 10: Frontend — página `/ayuda` (Ayuda.jsx)

**Files:**
- Create: `frontend/src/pages/Ayuda.jsx`
- Modify: `frontend/src/App.jsx`

- [ ] **Step 1: Crear `frontend/src/pages/Ayuda.jsx`**

```jsx
// frontend/src/pages/Ayuda.jsx
import { useEffect, useMemo, useState } from 'react';
import ReactMarkdown from 'react-markdown';
import { useLocation } from 'react-router-dom';
import { parseManualSections, slugify } from '../utils/parseManual';
import ManualSearch from '../components/help/ManualSearch';
import ManualToc from '../components/help/ManualToc';

export default function Ayuda() {
  const [markdown, setMarkdown] = useState('');
  const [activeAnchor, setActiveAnchor] = useState(null);
  const location = useLocation();

  useEffect(() => {
    fetch('/manual/manual-elvia.md', { cache: 'no-cache' })
      .then(r => r.ok ? r.text() : Promise.reject(new Error('No se pudo cargar el manual')))
      .then(setMarkdown)
      .catch(err => setMarkdown(`# Error\n\n${err.message}`));
  }, []);

  const sections = useMemo(() => parseManualSections(markdown), [markdown]);

  // Scroll a la sección indicada en el hash al cargar
  useEffect(() => {
    if (!markdown) return;
    const hash = location.hash.replace('#', '');
    if (hash) {
      setTimeout(() => {
        const el = document.getElementById(hash);
        if (el) { el.scrollIntoView({ behavior: 'smooth', block: 'start' }); setActiveAnchor(hash); }
      }, 100);
    }
  }, [markdown, location.hash]);

  // Scroll-spy: marca como activa la sección visible
  useEffect(() => {
    if (sections.length === 0) return;
    const handler = () => {
      let candidate = null;
      for (const s of sections) {
        const el = document.getElementById(s.anchor);
        if (el && el.getBoundingClientRect().top < 140) candidate = s.anchor;
      }
      if (candidate) setActiveAnchor(candidate);
    };
    window.addEventListener('scroll', handler, { passive: true });
    return () => window.removeEventListener('scroll', handler);
  }, [sections]);

  const jumpTo = (anchor) => {
    const el = document.getElementById(anchor);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' });
      setActiveAnchor(anchor);
      // actualizar hash sin recargar
      history.replaceState(null, '', `#${anchor}`);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
      <header className="mb-6">
        <h1 className="text-2xl sm:text-3xl font-bold text-on-surface mb-2">Manual de Uso — ELVIA</h1>
        <p className="text-sm text-on-surface-variant">Aprende a sacar el máximo provecho de cada módulo. También puedes preguntarle a ELVIA en el chat.</p>
      </header>

      <div className="mb-6 max-w-2xl">
        <ManualSearch sections={sections} onJump={jumpTo} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[260px_minmax(0,1fr)] gap-8">
        <aside className="hidden lg:block">
          <ManualToc sections={sections} activeAnchor={activeAnchor} onJump={jumpTo} />
        </aside>

        <article className="manual-content prose prose-sm sm:prose lg:prose-lg max-w-none">
          <ReactMarkdown
            components={{
              h1: ({ children }) => <h1 id={slugify(String(children))} className="text-3xl font-bold mt-6 mb-4 scroll-mt-24">{children}</h1>,
              h2: ({ children }) => <h2 id={slugify(String(children))} className="text-2xl font-bold mt-10 mb-3 scroll-mt-24 border-b border-outline-variant/30 pb-2">{children}</h2>,
              h3: ({ children }) => <h3 id={slugify(String(children))} className="text-lg font-semibold mt-6 mb-2 scroll-mt-24 text-primary">{children}</h3>,
              p: (props) => <p className="text-on-surface leading-relaxed mb-3" {...props} />,
              ul: (props) => <ul className="list-disc pl-6 mb-3 space-y-1" {...props} />,
              ol: (props) => <ol className="list-decimal pl-6 mb-3 space-y-1" {...props} />,
              a: (props) => <a className="text-primary underline" target="_blank" rel="noreferrer" {...props} />,
            }}
          >
            {markdown}
          </ReactMarkdown>
        </article>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Registrar `/ayuda` en `App.jsx`**

Agregar el import lazy junto a los otros (alfabéticamente o al final del bloque):

```javascript
const Ayuda             = lazy(() => import('./pages/Ayuda'))
```

Agregar `'/ayuda'` al array `RUTAS_APP`:

```javascript
const RUTAS_APP = [
  '/dashboard', '/cv-optimizer', '/cv-desde-cero', '/cv-vs-job', '/jobs',
  '/mis-cvs', '/mis-vacantes', '/pipeline', '/perfil', '/mi-plan',
  '/entrevista', '/biblioteca', '/linkedin-pro', '/onboarding',
  '/bienestar', '/proyecto-laboral', '/infografias', '/expertos', '/mis-metricas',
  '/ayuda'
]
```

Y agregar la `<Route>` dentro del bloque de rutas autenticadas (siguiendo el patrón del resto, ej. cerca de `/bienestar`):

```jsx
<Route path="/ayuda" element={<Ayuda />} />
```

- [ ] **Step 3: Smoke test visual**

```bash
cd frontend
npm run dev
```

Abrir `http://localhost:5173/ayuda` autenticado. Verificar:
1. El manual carga y se renderiza con headings, listas y párrafos.
2. El TOC lateral aparece a la izquierda en desktop.
3. Hacer click en un módulo del TOC scrollea a la sección.
4. Buscar "Mis Documentos" en el buscador muestra resultados; al hacer click salta a la sección.
5. Abrir `/ayuda#modulo-3-cv-vs-vacante` directamente → la página carga y scrollea automáticamente.

- [ ] **Step 4: Commit**

```bash
git add frontend/src/pages/Ayuda.jsx frontend/src/App.jsx
git commit -m "feat(ayuda): pagina /ayuda con TOC, buscador y deep-links por seccion"
```

---

## Task 11: Frontend — link a /ayuda en Sidebar

**Files:**
- Modify: `frontend/src/components/common/Sidebar.jsx`

- [ ] **Step 1: Localizar el patrón de items existentes**

Abrir `frontend/src/components/common/Sidebar.jsx`, buscar dónde están los links (`NavLink` o equivalente) hacia rutas como `/bienestar`, `/mis-metricas`, `/expertos`. Identificar la estructura (`{ to, label, Icon }`).

- [ ] **Step 2: Agregar el link a `/ayuda`**

Importar `Question` o `BookOpen` de `@phosphor-icons/react` si no está, y agregar el item al array de navegación. Ubicarlo al final del bloque de "ayuda/soporte" o cerca de "Mentor Experto" (según la estructura actual):

```jsx
import { Question } from '@phosphor-icons/react';
// ...
{ to: '/ayuda', label: 'Manual de uso', Icon: Question },
```

NOTA: ajustar la sintaxis exacta al patrón del Sidebar actual. No reescribir el componente — solo agregar 1 item.

- [ ] **Step 3: Smoke visual**

Recargar la app. Verificar que el link aparece en el sidebar y que al hacer click navega a `/ayuda`.

- [ ] **Step 4: Commit**

```bash
git add frontend/src/components/common/Sidebar.jsx
git commit -m "feat(ayuda): link Manual de uso en Sidebar"
```

---

## Task 12: Frontend — extender useChat con modo "manual"

**Files:**
- Modify: `frontend/src/hooks/useChat.js`

- [ ] **Step 1: Agregar parámetro `mode` y switch de endpoint**

Modificar `useChat` para aceptar `{ mode }` y usar `/api/chat/manual` cuando `mode === 'manual'`. Mantener compatibilidad: si no se pasa, default `mode='general'` (DeepSeek). Agregar también el state `citas` para renderizado en el bot.

Reemplazar el archivo completo:

```javascript
// frontend/src/hooks/useChat.js
import { useState } from 'react';
import { useLocation } from 'react-router-dom';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';

const MAX_MENSAJES_FREE = 20;
const MAX_MENSAJES_PRO  = 50;

const MENSAJE_DASHBOARD = `¡Hola! Soy **ELVIA**, tu mentora de carrera 24/7. 👋

Estás en tu **Dashboard** — tu centro de control.

Este es el mejor momento para tomarte un respiro y dedicar el tiempo que necesitas para llenar tu **Gerente de Búsqueda**. Ahí construyes tu estrategia completa: perfil, recursos, semana de búsqueda y propuesta de valor. Cuanto antes lo completes, antes se desbloquean todas las herramientas.

¿En qué te puedo ayudar hoy?`;

const MENSAJE_GENERAL = `Hola, soy **ELVIA**, tu asistente y mentora en todo tu proceso de crecimiento profesional. Puedes preguntarme cómo usar cualquier función de la app o pedirme consejos sobre tu carrera.`;

const MENSAJE_MANUAL = `📖 **Modo manual activado.** Respondo solo con información oficial del manual de uso de ELVIA. Si no encuentro la respuesta ahí, te lo digo y te conecto con un mentor.`;

export function useChat({ mode = 'general' } = {}) {
  const location = useLocation();
  const { isPaidPlan } = useAuth();

  const MAX_MENSAJES_SESION = isPaidPlan ? MAX_MENSAJES_PRO : MAX_MENSAJES_FREE;

  const initialMessage = mode === 'manual'
    ? MENSAJE_MANUAL
    : (location.pathname === '/dashboard' ? MENSAJE_DASHBOARD : MENSAJE_GENERAL);

  const [messages, setMessages] = useState([
    { role: 'assistant', content: initialMessage }
  ]);
  const [inputVal, setInputVal] = useState('');
  const [loading, setLoading] = useState(false);

  const mensajesUsuario = messages.filter(m => m.role === 'user').length;
  const limitAlcanzado = mensajesUsuario >= MAX_MENSAJES_SESION;

  const sendMessage = async (e, quickText = null) => {
    if (e) e.preventDefault();
    const userMsg = quickText || inputVal.trim();
    if (!userMsg || loading) return;

    if (limitAlcanzado) {
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: `Has alcanzado el límite de ${MAX_MENSAJES_SESION} mensajes por sesión. Recarga la página para iniciar una nueva conversación.`
      }]);
      return;
    }

    if (!quickText) setInputVal('');

    const newMessages = [...messages, { role: 'user', content: userMsg }];
    setMessages(newMessages);
    setLoading(true);

    try {
      const endpoint = mode === 'manual' ? '/api/chat/manual' : '/api/chat';
      const payload = mode === 'manual'
        ? { message: userMsg, history: messages.slice(1) }
        : { message: userMsg, history: messages.slice(1), context: `El usuario se encuentra en la URL: ${location.pathname}` };

      const res = await api.post(endpoint, payload);

      if (res.reply) {
        setMessages(prev => [...prev, {
          role: 'assistant',
          content: res.reply,
          citas: res.citas || [],
          requiere_escalamiento: res.requiere_escalamiento || false,
        }]);
      } else if (res.error) {
        const esAuthError = ['Token inválido o expirado', 'Token no proporcionado', 'No autorizado'].includes(res.error);
        const msg = esAuthError
          ? 'Tu sesión ha expirado. Por favor, recarga la página e inicia sesión nuevamente.'
          : 'Lo siento, hubo un error al conectar con mis sistemas. Intenta de nuevo más tarde.';
        setMessages(prev => [...prev, { role: 'assistant', content: msg }]);
      }
    } catch (err) {
      const msg = err?.message || 'Error de red. Asegúrate de tener conexión.';
      setMessages(prev => [...prev, { role: 'assistant', content: msg }]);
    } finally {
      setLoading(false);
    }
  };

  const resetConversation = () => {
    setMessages([{ role: 'assistant', content: initialMessage }]);
    setInputVal('');
  };

  return {
    messages,
    inputVal,
    setInputVal,
    loading,
    sendMessage,
    resetConversation,
    mensajesUsuario,
    maxMensajes: MAX_MENSAJES_SESION,
    limitAlcanzado,
    mode,
  };
}
```

- [ ] **Step 2: Commit**

```bash
git add frontend/src/hooks/useChat.js
git commit -m "feat(bot): useChat soporta modo manual (endpoint /api/chat/manual)"
```

---

## Task 13: Frontend — AiChatBot con toggle de modo Manual y citas

**Files:**
- Modify: `frontend/src/components/chat/AiChatBot.jsx`

- [ ] **Step 1: Agregar toggle de modo y render de citas**

Modificar `AiChatBot.jsx` para:
1. Mantener un state `mode` (`'general' | 'manual'`).
2. Llamar a `useChat({ mode })` con ese state. Al cambiar `mode`, llamar `resetConversation()`.
3. Agregar un botón toggle en el header del chat: "Sobre cómo usar ELVIA" (cuando general) / "Conversación general" (cuando manual).
4. Renderizar las citas debajo de cada mensaje del asistente cuando `msg.citas?.length > 0`.
5. Si `msg.requiere_escalamiento === true`, mostrar un banner con CTA "Hablar con un mentor" que navega a `/expertos`.

Cambios mínimos (no reescribir todo el archivo):

A) Imports (agregar al bloque existente):
```javascript
import { useNavigate } from 'react-router-dom';
import { BookOpen, ChatCircle } from '@phosphor-icons/react';
```

B) Reemplazar la llamada a `useChat()` (línea ~52) por:
```javascript
const [mode, setMode] = useState('general');
const { messages, inputVal, setInputVal, loading, sendMessage, resetConversation, mensajesUsuario, maxMensajes, limitAlcanzado } = useChat({ mode });
const navigate = useNavigate();
```

C) Agregar handler para cambiar modo (después de los useEffect):
```javascript
const switchMode = (next) => {
  if (next === mode) return;
  setMode(next);
  resetConversation();
};
```

D) Dentro del header del chat (cerca de los botones expandir/cerrar), agregar el toggle:
```jsx
<button
  onClick={() => switchMode(mode === 'manual' ? 'general' : 'manual')}
  className="px-3 py-1 rounded-full bg-white/15 hover:bg-white/25 text-white text-[11px] font-semibold flex items-center gap-1 transition-colors"
  title={mode === 'manual' ? 'Cambiar a conversación general' : 'Preguntar sobre cómo usar ELVIA'}
>
  {mode === 'manual' ? <ChatCircle size={12} weight="bold" /> : <BookOpen size={12} weight="bold" />}
  {mode === 'manual' ? 'General' : 'Manual'}
</button>
```

E) Dentro del render de cada mensaje del asistente (dentro del `<ReactMarkdown>` envoltorio, ANTES del cierre del `</div>` del bubble), agregar el bloque de citas:
```jsx
{msg.role === 'assistant' && msg.citas && msg.citas.length > 0 && (
  <div className="mt-3 pt-3 border-t border-outline-variant/30">
    <p className="text-[10px] font-bold uppercase tracking-wider text-on-surface-variant mb-1.5">Fuente del manual:</p>
    <div className="flex flex-wrap gap-1.5">
      {msg.citas.map((c, idx) => (
        <button
          key={`${c.anchor}-${idx}`}
          onClick={() => navigate(`/ayuda#${c.anchor}`)}
          className="text-[11px] px-2 py-1 rounded-full bg-primary/10 hover:bg-primary/20 text-primary font-semibold transition-colors"
        >
          📖 {c.seccion}
        </button>
      ))}
    </div>
  </div>
)}
{msg.role === 'assistant' && msg.requiere_escalamiento && (
  <div className="mt-3">
    <button
      onClick={() => navigate('/expertos')}
      className="text-[12px] px-3 py-1.5 rounded-full bg-amber-500 hover:bg-amber-600 text-white font-semibold transition-colors"
    >
      🙋 Hablar con un mentor experto
    </button>
  </div>
)}
```

- [ ] **Step 2: Smoke test visual**

Recargar el chat. Verificar:
1. El toggle "Manual" / "General" aparece en el header del chat.
2. Al hacer click cambia el modo y resetea la conversación.
3. En modo Manual, preguntar "¿dónde encuentro mi CV?" devuelve respuesta + cita "Módulo 6: Mis Documentos".
4. Hacer click en la cita navega a `/ayuda#modulo-6-mis-documentos` y scrollea a la sección.
5. Preguntar algo fuera del manual ("¿cuánto cuesta Netflix?") devuelve "No encuentro esto…" + botón "Hablar con un mentor".

- [ ] **Step 3: Commit**

```bash
git add frontend/src/components/chat/AiChatBot.jsx
git commit -m "feat(bot): toggle modo Manual + render de citas y escalamiento a mentor"
```

---

## Task 14: Instrumentación de telemetría con useTrackEvent

**Files:**
- Modify: `frontend/src/hooks/useChat.js`
- Modify: `frontend/src/pages/Ayuda.jsx`

- [ ] **Step 1: Importar useTrackEvent en useChat.js y emitir eventos**

Agregar al import de `useChat.js`:

```javascript
import { useTrackEvent } from './useTrackEvent';
```

Dentro del hook, después de `const { isPaidPlan } = useAuth();`:

```javascript
const trackEvent = useTrackEvent();
```

Justo después del `setLoading(true);` (antes del `try`), emitir:

```javascript
trackEvent('bot_ayuda_query', {
  mode,
  question_length: userMsg.length,
  pathname: location.pathname,
});
```

Y dentro del bloque `if (res.reply)` emitir:

```javascript
trackEvent('bot_ayuda_reply', {
  mode,
  has_citas: (res.citas || []).length > 0,
  cita_principal: res.citas?.[0]?.anchor || null,
  escalated: Boolean(res.requiere_escalamiento),
});
```

- [ ] **Step 2: Emitir event al entrar a /ayuda**

En `Ayuda.jsx` agregar el import y el efecto:

```javascript
import { useTrackEvent } from '../hooks/useTrackEvent';

// dentro del componente:
const trackEvent = useTrackEvent();
useEffect(() => {
  trackEvent('manual_open', { hash: location.hash || null });
}, []);
```

- [ ] **Step 3: Smoke test**

Recargar la app. Abrir el chat en modo Manual y hacer una pregunta. Visitar `/ayuda`. Verificar en la tabla `user_events` (Supabase Studio) que aparecen registros `bot_ayuda_query`, `bot_ayuda_reply`, `manual_open`.

- [ ] **Step 4: Commit**

```bash
git add frontend/src/hooks/useChat.js frontend/src/pages/Ayuda.jsx
git commit -m "feat(telemetria): trackear bot_ayuda_query/reply y manual_open"
```

---

## Task 15: AI Hard Cap — sumar Modo Manual al contador diario

**Files:**
- Modify: `backend/src/middleware/dailyCap.js` (si aplica al endpoint) o `backend/src/routes/manualChat.js`

- [ ] **Step 1: Inspeccionar `dailyCap.js`**

Abrir `backend/src/middleware/dailyCap.js`. Verificar si aplica un cap global por usuario en todas las llamadas Anthropic. Si lo hace, agregar `manualChat` al middleware en `routes/manualChat.js` (entre `auth` y `manualChatLimit`).

Editar `backend/src/routes/manualChat.js`:

```javascript
const dailyCap = require('../middleware/dailyCap');
router.post('/', auth, dailyCap, manualChatLimit, handleManualChat);
```

Si `dailyCap` requiere un identificador de feature, pasar `dailyCap('bot_manual')` según el contrato de la función (verificar firma).

- [ ] **Step 2: Smoke test del cap**

Forzar 5 llamadas en rápida sucesión con `curl`. Verificar que el contador del cap se incrementa (logs del backend) y que al superar el cap diario configurado, devuelve 429.

- [ ] **Step 3: Commit**

```bash
git add backend/src/routes/manualChat.js
git commit -m "feat(manual): integrar Bot Modo Manual al AI Hard Cap diario"
```

---

## Task 16: E2E manual — checklist de demo Telefónica

**Files:**
- Create: `docs/manual/DEMO_TELEFONICA_CHECKLIST.md`

- [ ] **Step 1: Crear checklist**

```markdown
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
```

- [ ] **Step 2: Commit**

```bash
git add docs/manual/DEMO_TELEFONICA_CHECKLIST.md
git commit -m "docs(manual): checklist de demo Telefonica para Bot Modo Manual"
```

---

## Task 17: Merge a `main` y deploy

**Files:** (ninguno nuevo, solo flujo git)

- [ ] **Step 1: Push de la branch dev**

```bash
git push origin dev
```

- [ ] **Step 2: PR a main**

Abrir PR desde `dev` a `main`. Título: `feat(bot+ayuda): Bot ELVIA Modo Manual + página /ayuda para Telefónica`.

Body del PR:

```markdown
## Summary
- Nueva página `/ayuda` autenticada con manual de uso, TOC y buscador
- Bot ELVIA gana toggle "Modo Manual" que responde solo con el manual y cita la sección
- Endpoint `POST /api/chat/manual` con Claude Haiku 4.5 + prompt caching del manual completo
- Rate limit 10/min y 20/día por usuario
- Filtro B2B vía system prompt: omite menciones a planes B2C / cuenta demo cuando el usuario tiene `company_id`
- Telemetría: `manual_open`, `bot_ayuda_query`, `bot_ayuda_reply` en `user_events`

## Test plan
- [ ] Smoke `/ayuda` (TOC, buscador, deep-links)
- [ ] Toggle Modo Manual del bot funciona y cita secciones
- [ ] Cita "Módulo 6: Mis Documentos" navega correcto
- [ ] Rate limit dispara 429 a la 11a query
- [ ] Telemetría aparece en Supabase
- [ ] Demo Telefónica: ejecutar `docs/manual/DEMO_TELEFONICA_CHECKLIST.md`
```

- [ ] **Step 3: Merge tras revisión**

Merge a `main` → Netlify (frontend) y Railway (backend) auto-deploy. Validar en producción con el checklist de demo.

- [ ] **Step 4: Notificar a Telefónica**

Compartir con HR de Telefónica (Mario/Vanessa) el link al manual `/ayuda` y la nota de que el bot ahora tiene "Modo Manual". Sugerir 3 preguntas semilla para sus candidatos.

---

## Self-Review

**Spec coverage:**
- Manual embebido `/ayuda`: Tasks 1, 2, 7, 8, 9, 10, 11
- Backend Bot Modo Manual con prompt caching: Tasks 3, 4, 5, 6
- Integración en bot existente con citas: Tasks 12, 13
- Telemetría y AI Hard Cap: Tasks 14, 15
- Demo Telefónica + deploy: Tasks 16, 17
- Filtro B2B Opción A (un solo manual + system prompt): Task 4 (instrucción base) + Task 6 (controller pasa `isB2B` y `tenantSlug`)
- Solo autenticado: Task 6 (middleware `auth` antes del rate limit) + Task 10 (ruta dentro del bloque autenticado de `App.jsx`)

**Placeholders:** ninguno detectado tras revisión. Todos los pasos incluyen código completo o el archivo exacto a modificar con el diff puntual.

**Type / nombre consistencia:**
- `responderConManual({ question, userContext, history })` definido en Task 4 y usado igual en Task 6 ✓
- `parseManualSections(markdown)` y `slugify(text)` consistentes entre Tasks 7, 9, 10 ✓
- Modelo Anthropic: `claude-haiku-4-5-20251001` constante en Task 4 y referenciado en Task 16 (env var opcional) ✓
- Endpoint `/api/chat/manual` consistente en Tasks 6, 12, 16 ✓
- Estructura citas `{ seccion, anchor }` consistente en Tasks 4, 6, 13, 16 ✓

**Riesgos asumidos para entregar esta semana:**
- Rate limit en memoria (no Redis): suficiente para 1 instancia Railway con ≤200 usuarios concurrentes. Migrar si escala.
- Prompt cache TTL 5 min: con uso esporádico se pierde el cache. Costo aceptable (~10K tokens × USD por 1M de Haiku = centavos). Si Telefónica genera carga sostenida, agregar keep-alive ping cada 4 min en sprint siguiente.
- Manual unificado B2C/B2B con filtro vía system prompt: riesgo bajo de filtración accidental porque el manual no menciona precios individuales en mensajes para usuario final. Validar empíricamente con el smoke test del checklist.
