// context-contract.mjs — verificador genérico del contrato de un React Context+hook.
// El build NO caza un typo en `const { foo } = useXxxCtx()` si `foo` no existe en el
// API del hook proveedor: en runtime sería `undefined` silencioso. Este check parsea
// el `return {...}` de nivel superior del hook proveedor y confirma que CADA
// identificador que los consumidores destructuran del consumer-hook existe en ese API.
//
// Uso (desde frontend/):
//   node scripts/context-contract.mjs <hookFile> <hookFnName> <consumerCall> <dir> [extraFile...]
// Ej:
//   node scripts/context-contract.mjs src/features/interview/useEntrevista.js useEntrevista useEntrevistaCtx src/features/interview
import { readFileSync, readdirSync } from 'node:fs'
import { join } from 'node:path'
import { parse } from '@babel/parser'
import _traverse from '@babel/traverse'
const traverse = _traverse.default || _traverse

const [hookFile, hookFn, consumerCall, dir, ...extra] = process.argv.slice(2)
if (!hookFile || !hookFn || !consumerCall || !dir) {
  console.error('uso: node scripts/context-contract.mjs <hookFile> <hookFnName> <consumerCall> <dir> [extraFile...]')
  process.exit(2)
}

const parseFile = (f) => parse(readFileSync(f, 'utf8'), { sourceType: 'module', plugins: ['jsx'] })

function walk(d) {
  const out = []
  for (const e of readdirSync(d, { withFileTypes: true })) {
    const p = join(d, e.name)
    if (e.isDirectory()) out.push(...walk(p))
    else if (/\.(js|jsx)$/.test(e.name)) out.push(p)
  }
  return out
}

// 1. Claves del API: SOLO el return de nivel superior del hook proveedor.
const hookKeys = new Set()
{
  const ast = parseFile(hookFile)
  traverse(ast, {
    FunctionDeclaration(path) {
      if (path.node.id?.name !== hookFn) return
      for (const stmt of path.node.body.body) {
        if (stmt.type !== 'ReturnStatement' || stmt.argument?.type !== 'ObjectExpression') continue
        for (const prop of stmt.argument.properties) {
          if (prop.key?.name) hookKeys.add(prop.key.name)
        }
      }
    },
  })
}
if (hookKeys.size === 0) { console.error(`❌ no pude extraer el API de ${hookFn}() en ${hookFile}`); process.exit(2) }

// 2. Consumidores: cada `const { ... } = consumerCall()`
const files = walk(dir).concat(extra)
const used = new Set()
let errors = 0
for (const f of files) {
  const ast = parseFile(f)
  traverse(ast, {
    VariableDeclarator(path) {
      const init = path.node.init
      if (init?.type !== 'CallExpression' || init.callee?.name !== consumerCall) return
      if (path.node.id?.type !== 'ObjectPattern') return
      for (const prop of path.node.id.properties) {
        const name = prop.key?.name
        if (!name) continue
        used.add(name)
        if (!hookKeys.has(name)) {
          console.error(`❌ ${f}: destructura "${name}" que NO existe en el API de ${hookFn}()`)
          errors++
        }
      }
    },
  })
}

const huerfanas = [...hookKeys].filter((k) => !used.has(k))
console.log(`API de ${hookFn}(): ${hookKeys.size} claves · consumidas vía ${consumerCall}(): ${used.size}`)
if (huerfanas.length) console.log(`ℹ️  expuestas pero sin consumir (${huerfanas.length}): ${huerfanas.join(', ')}`)
if (errors === 0) console.log('✅ contrato OK — todos los destructures existen en el API')
process.exit(errors === 0 ? 0 : 1)
