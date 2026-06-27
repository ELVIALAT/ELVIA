// codemod-phosphor.mjs — convierte `import * as PI from '@phosphor-icons/react'`
// (namespace import, rompe el tree-shaking → empaqueta toda la librería) a named
// imports de SOLO los iconos usados. Reemplaza `PI.X` → `X` en el cuerpo.
//
// Uso (desde frontend/):  node scripts/codemod-phosphor.mjs
import { readFileSync, writeFileSync, readdirSync } from 'node:fs'
import { join } from 'node:path'

function walk(dir) {
  const out = []
  for (const e of readdirSync(dir, { withFileTypes: true })) {
    const p = join(dir, e.name)
    if (e.isDirectory()) out.push(...walk(p))
    else if (/\.(jsx|js)$/.test(e.name)) out.push(p)
  }
  return out
}

const NS_RE = /import \* as PI from '@phosphor-icons\/react'/
let changed = 0
for (const f of walk('src')) {
  let c = readFileSync(f, 'utf8')
  if (!NS_RE.test(c)) continue

  // Recolectar iconos usados como PI.X (PascalCase).
  const icons = new Set()
  for (const m of c.matchAll(/\bPI\.([A-Z][A-Za-z0-9]*)/g)) icons.add(m[1])
  const sorted = [...icons].sort()

  // PI.X → X
  c = c.replace(/\bPI\.([A-Z][A-Za-z0-9]*)/g, '$1')
  // namespace import → named import
  c = c.replace(NS_RE, `import { ${sorted.join(', ')} } from '@phosphor-icons/react'`)

  // Sanidad: no debe quedar ningún `PI` suelto (palabra completa).
  if (/\bPI\b/.test(c)) {
    console.error(`⚠️  ${f}: quedó un 'PI' suelto tras el codemod — revisar a mano`)
  }

  writeFileSync(f, c)
  changed++
  console.log(`${f}  (${sorted.length}): ${sorted.join(', ')}`)
}
console.log(`\n${changed} archivos convertidos.`)
