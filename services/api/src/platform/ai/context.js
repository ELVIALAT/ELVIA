// Contexto de IA por request via AsyncLocalStorage.
// Permite que `complete()` (en lo profundo de las tasks) conozca el userId/tenant del request
// sin tener que threadear el contexto por todas las firmas de controller→service→task.
//
// Flujo: middleware `aiContext` abre el store al inicio del request → `auth` escribe userId →
// `dailyCap` escribe tenant (company_id, ya lo resuelve) → `complete` lo lee para el ledger de costo.
const { AsyncLocalStorage } = require('async_hooks');

const storage = new AsyncLocalStorage();

// Abre un store nuevo para el request y ejecuta el resto de la cadena dentro de él.
function runWithAiContext(fn) {
  return storage.run({ userId: null, tenant: null }, fn);
}

// Lee el contexto actual (o {} si no hay store — p.ej. tareas fuera de un request HTTP).
function getAiContext() {
  return storage.getStore() || {};
}

function setAiUser(userId) {
  const s = storage.getStore();
  if (s) s.userId = userId;
}

function setAiTenant(tenant) {
  const s = storage.getStore();
  if (s) s.tenant = tenant;
}

module.exports = { runWithAiContext, getAiContext, setAiUser, setAiTenant };
