// Tests del middleware de validación Zod + envelope (Fase 1, tareas 4-5).
const { validate } = require('../src/middleware/validate');
const schemas = require('../src/schemas');

// Mock mínimo de res
function mockRes() {
  return {
    statusCode: null, body: null,
    status(c) { this.statusCode = c; return this; },
    json(b) { this.body = b; return this; },
  };
}

function run(schema, body) {
  const req = { body };
  const res = mockRes();
  let nexted = false;
  validate(schema)(req, res, () => { nexted = true; });
  return { req, res, nexted };
}

describe('validate middleware + envelope', () => {
  test('body válido → next() y req.body queda parseado', () => {
    const { nexted, req } = run(schemas.companyRegistration, { email: 'A@B.COM', password: '12345678' });
    expect(nexted).toBe(true);
    expect(req.body.email).toBe('a@b.com'); // normalizado (toLowerCase + trim)
  });

  test('body inválido → 400 con envelope, NO 500', () => {
    const { nexted, res } = run(schemas.companyRegistration, { email: 'malo', password: '1' });
    expect(nexted).toBe(false);
    expect(res.statusCode).toBe(400);
    expect(res.body.success).toBe(false);
    expect(res.body.error).toBe('VALIDATION_ERROR');      // string legacy
    expect(res.body.error_detail.code).toBe('VALIDATION_ERROR'); // forma nueva
    expect(typeof res.body.mensaje).toBe('string');       // retrocompat frontend
  });

  // (jobs/compatibility schema migrado a src/modules/jobs — cubierto en jobs.test.js)

  test('admin/tenants con slug inválido → rechaza con mensaje claro', () => {
    const { res, nexted } = run(schemas.adminCreateTenant, {
      nombre: 'X', slug: 'Slug Con Espacios', hr_nombre: 'Y', hr_email: 'y@z.com',
    });
    expect(nexted).toBe(false);
    expect(res.body.mensaje).toMatch(/slug/i);
  });

  test('allowlist/bulk vacío → rechaza (al menos una fila)', () => {
    const { res, nexted } = run(schemas.allowlistBulk, { rows: [] });
    expect(nexted).toBe(false);
    expect(res.statusCode).toBe(400);
  });
});
