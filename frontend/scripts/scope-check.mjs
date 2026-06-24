// scope-check.mjs — verificador de "FREE=0" para extracciones verbatim.
// Parsea un archivo .jsx con babel y reporta identificadores referenciados que NO
// están ligados en el módulo (ni declarados, ni importados, ni props destructurados).
// Tras filtrar globals conocidos (React/browser/JS builtins), un componente bien
// extraído debe dar FREE=0 — cualquier sobrante es una dependencia del orquestador
// que se olvidó de pasar por props.
//
// Uso (desde frontend/):  node scripts/scope-check.mjs src/features/cv/components/PasoDatos.jsx
import { readFileSync } from 'node:fs'
import { parse } from '@babel/parser'
import _traverse from '@babel/traverse'
const traverse = _traverse.default || _traverse

const ALLOWED = new Set([
  // React / runtime
  'React',
  // Browser
  'window', 'document', 'console', 'navigator', 'localStorage', 'sessionStorage',
  'setTimeout', 'clearTimeout', 'setInterval', 'clearInterval', 'fetch', 'alert',
  'Blob', 'File', 'FileReader', 'FormData', 'URL', 'URLSearchParams', 'atob', 'btoa',
  'requestAnimationFrame', 'cancelAnimationFrame', 'structuredClone', 'crypto',
  // Browser — media / web APIs
  'Audio', 'Image', 'AudioContext', 'MediaRecorder', 'SpeechSynthesisUtterance',
  'Notification', 'IntersectionObserver', 'ResizeObserver', 'MutationObserver',
  'AbortController', 'TextEncoder', 'TextDecoder', 'Worker', 'EventSource',
  // JS builtins
  'Object', 'Array', 'String', 'Number', 'Boolean', 'Math', 'JSON', 'Date',
  'Promise', 'Map', 'Set', 'WeakMap', 'WeakSet', 'Symbol', 'RegExp', 'Error',
  'parseInt', 'parseFloat', 'isNaN', 'isFinite', 'encodeURIComponent',
  'decodeURIComponent', 'undefined', 'NaN', 'Infinity', 'globalThis',
])

const files = process.argv.slice(2)
if (files.length === 0) {
  console.error('uso: node scripts/scope-check.mjs <archivo.jsx> [más archivos...]')
  process.exit(2)
}

let totalFree = 0
for (const file of files) {
  const code = readFileSync(file, 'utf8')
  const ast = parse(code, {
    sourceType: 'module',
    plugins: ['jsx'],
  })
  let globals = []
  traverse(ast, {
    Program(path) {
      globals = Object.keys(path.scope.globals).sort()
    },
  })
  const free = globals.filter((g) => !ALLOWED.has(g))
  totalFree += free.length
  if (free.length === 0) {
    console.log(`✅ FREE=0  ${file}`)
  } else {
    console.log(`❌ FREE=${free.length}  ${file}`)
    console.log(`   → ${free.join(', ')}`)
  }
}
process.exit(totalFree === 0 ? 0 : 1)
