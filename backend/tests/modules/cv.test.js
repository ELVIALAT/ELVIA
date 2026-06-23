// Tests del módulo cv (repository + verificación del fix anti-patrón C-3).
const repo = require('../../src/modules/cv/cv.repository');
const fs = require('fs');
const path = require('path');

// Mock del query builder de Supabase
function mockDb(rows = {}) {
  const make = (table) => {
    const ctx = { _table: table, _row: rows[table] };
    const chain = {
      select: () => chain,
      eq: () => chain,
      order: () => chain,
      limit: () => chain,
      maybeSingle: async () => ({ data: ctx._row || null, error: null }),
      single: async () => ctx._row ? { data: ctx._row, error: null } : { data: null, error: { message: 'no rows' } },
      insert: () => ({ select: () => ({ single: async () => ({ data: { id: 'new-id' }, error: null }) }) }),
      then: undefined,
    };
    // getRecentCvResults usa await sobre la cadena → resolver con data
    chain.then = (resolve) => resolve({ data: ctx._row || [], error: null });
    return chain;
  };
  return { from: make };
}

describe('cv.repository', () => {
  test('getProfileIdentity devuelve nombre/apellido', async () => {
    const db = mockDb({ profiles: { nombre1: 'Ana', apellido1: 'Lopez' } });
    const id = await repo.getProfileIdentity(db, 'u1');
    expect(id).toEqual({ nombre1: 'Ana', apellido1: 'Lopez' });
  });

  test('getOwnedCvResult devuelve null si no existe (aislamiento)', async () => {
    const db = mockDb({});
    const cv = await repo.getOwnedCvResult(db, 'cv-de-otro', 'u1');
    expect(cv).toBeNull();
  });

  test('insertCvResult lanza si el insert falla (NO fallback a admin)', async () => {
    const db = { from: () => ({ insert: () => ({ select: () => ({ single: async () => ({ data: null, error: { message: 'RLS' } }) }) }) }) };
    await expect(repo.insertCvResult(db, { user_id: 'u1' })).rejects.toBeTruthy();
  });
});

describe('anti-patrón C-3 (RLS bypass) eliminado', () => {
  test('cv.generar.controller ya NO usa supabaseAdmin', () => {
    const src = fs.readFileSync(
      path.join(__dirname, '../../src/modules/cv/cv.generar.controller.js'), 'utf8'
    );
    expect(src).not.toContain('supabaseAdmin');
  });
});
