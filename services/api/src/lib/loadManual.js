// backend/src/lib/loadManual.js
const fs = require('fs');
const path = require('path');

const DEFAULT_PATH = path.join(__dirname, '..', '..', 'data', 'manual-elvia.md');

let _cache = null;

function _slug(title) {
  return title
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[®©™]/g, '')
    .replace(/[^a-z0-9\s-]/g, '')
    .trim()
    .replace(/\s+/g, '-');
}

function _parseSections(text) {
  const lines = text.replace(/\r/g, '').split('\n');
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
