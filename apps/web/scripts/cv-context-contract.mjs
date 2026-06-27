// cv-context-contract.mjs — verifica el contrato del CVWizardContext.
// El build NO caza un typo en `const { foo } = useCVWizard()` si `foo` no existe
// en el API del hook: en runtime sería `undefined` silencioso. Este check parsea
// el `return {...}` de useCVWizardState() y confirma que CADA identificador que los
// consumidores destructuran de useCVWizard() existe en ese API.
//
// Uso (desde frontend/):  node scripts/cv-context-contract.mjs
import { readFileSync, readdirSync } from 'node:fs'
import { join } from 'node:path'
import { parse } from '@babel/parser'
import _traverse from '@babel/traverse'
const traverse = _traverse.default || _traverse

// walk recursivo (evita depender de fs.globSync, Node 22+)
function walk(dir) {
  const out = []
  for (const e of readdirSync(dir, { withFileTypes: true })) {
    const p = join(dir, e.name)
    if (e.isDirectory()) out.push(...walk(p))
    else if (/\.(js|jsx)$/.test(e.name)) out.push(p)
  }
  return out
}

const parseFile = (f) => parse(readFileSync(f, 'utf8'), { sourceType: 'module', plugins: ['jsx'] })

// 1. Claves del API que expone el hook (return {...} de useCVWizardState)
const hookKeys = new Set()
{
  const ast = parseFile('src/features/cv/useCVWizard.js')
  traverse(ast, {
    FunctionDeclaration(path) {
      if (path.node.id?.name !== 'useCVWizardState') return
      // Solo el return de NIVEL SUPERIOR del hook = el API real. Ignorar returns
      // anidados (prefillFromGerente, callbacks .map, etc.) para no contaminar.
      for (const stmt of path.node.body.body) {
        if (stmt.type !== 'ReturnStatement' || stmt.argument?.type !== 'ObjectExpression') continue
        for (const prop of stmt.argument.properties) {
          if (prop.key?.name) hookKeys.add(prop.key.name)
        }
      }
    },
  })
}
if (hookKeys.size === 0) { console.error('❌ no pude extraer el API de useCVWizardState'); process.exit(2) }

// 2. Consumidores: cada `const { ... } = useCVWizard()`
const files = walk('src/features/cv').concat(['src/pages/CVDesdeCero.jsx'])
const used = new Set()
let errors = 0
for (const f of files) {
  if (f.endsWith('CVWizardContext.jsx') || f.endsWith('useCVWizard.js')) continue
  const ast = parseFile(f)
  traverse(ast, {
    VariableDeclarator(path) {
      const init = path.node.init
      if (init?.type !== 'CallExpression' || init.callee?.name !== 'useCVWizard') return
      if (path.node.id?.type !== 'ObjectPattern') return
      for (const prop of path.node.id.properties) {
        const name = prop.key?.name
        if (!name) continue
        used.add(name)
        if (!hookKeys.has(name)) {
          console.error(`❌ ${f}: destructura "${name}" que NO existe en el API de useCVWizardState`)
          errors++
        }
      }
    },
  })
}

// 3. Info: claves del API que nadie consume (no es error, solo limpieza posible)
const huerfanas = [...hookKeys].filter((k) => !used.has(k))
console.log(`API del hook: ${hookKeys.size} claves · consumidas: ${used.size}`)
if (huerfanas.length) console.log(`ℹ️  expuestas pero sin consumir (${huerfanas.length}): ${huerfanas.join(', ')}`)
if (errors === 0) console.log('✅ contrato OK — todos los destructures existen en el API')
process.exit(errors === 0 ? 0 : 1)
