// scripts/sync-manual.js
// Copia docs/manual/manual-elvia.md a:
//   - frontend/public/manual/manual-elvia.md  (servido al cliente)
//   - backend/data/manual-elvia.md            (cargado en memoria al boot)
// Uso: node scripts/sync-manual.js

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
