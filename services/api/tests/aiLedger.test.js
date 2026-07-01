// Tests del ledger de costo de IA + contexto ALS + invariante de routing PII-lock.
// Mockeamos supabase para que la persistencia sea no-op determinista (sin BD real).
jest.mock('../src/lib/supabase', () => ({ supabaseAdmin: null, supabase: null, crearClienteAutenticado: () => null }));

const { normalizeUsage, recordCost } = require('../src/platform/ai/cost/ledger');
const { estimateCost } = require('../src/platform/ai/cost/rates');
const { aggregateByTenant } = require('../src/platform/ai/cost/report');
const { runWithAiContext, getAiContext, setAiUser, setAiTenant } = require('../src/platform/ai/context');
const { resolve } = require('../src/platform/ai/policy');

describe('ai/cost/rates · estimateCost', () => {
  it('aplica la tarifa de input por modelo', () => {
    expect(estimateCost({ model: 'claude-sonnet-4-6', inputTokens: 1_000_000 })).toBeCloseTo(3.0, 6);
  });
  it('suma input + output + cacheRead + cacheWrite', () => {
    // Haiku: 1 + 5 + 0.10 + 1.25 = 7.35 por 1M de cada uno
    const usd = estimateCost({ model: 'claude-haiku-4-5-20251001', inputTokens: 1e6, outputTokens: 1e6, cacheReadTokens: 1e6, cacheWriteTokens: 1e6 });
    expect(usd).toBeCloseTo(7.35, 6);
  });
  it('modelo desconocido → 0 (no NaN)', () => {
    expect(estimateCost({ model: 'modelo-inexistente', inputTokens: 1e6 })).toBe(0);
  });
});

describe('ai/cost/ledger · normalizeUsage', () => {
  it('normaliza el usage de Claude', () => {
    const u = normalizeUsage('claude', 'claude-haiku-4-5-20251001', {
      input_tokens: 10, output_tokens: 20, cache_read_input_tokens: 5, cache_creation_input_tokens: 2,
    });
    expect(u).toMatchObject({ inputTokens: 10, outputTokens: 20, cacheReadTokens: 5, cacheWriteTokens: 2 });
  });
  it('normaliza el usage de DeepSeek (formato OpenAI)', () => {
    const u = normalizeUsage('deepseek', 'deepseek-v4-flash', {
      prompt_tokens: 7, completion_tokens: 9, prompt_cache_hit_tokens: 3,
    });
    expect(u).toMatchObject({ inputTokens: 7, outputTokens: 9, cacheReadTokens: 3, cacheWriteTokens: 0 });
  });
  it('usage faltante → ceros', () => {
    expect(normalizeUsage('claude', 'm', null)).toMatchObject({ inputTokens: 0, outputTokens: 0, cacheReadTokens: 0 });
  });
});

describe('ai/cost/ledger · recordCost', () => {
  it('nunca tira y devuelve el usage normalizado aunque no haya BD', () => {
    const u = recordCost({ tenant: null, userId: null, task: 'cv.optimize', provider: 'claude', model: 'm', usage: { input_tokens: 1, output_tokens: 2 } });
    expect(u).toMatchObject({ inputTokens: 1, outputTokens: 2 });
  });
});

describe('ai/context · AsyncLocalStorage', () => {
  it('aísla el contexto por ejecución y permite setear user/tenant', () => {
    const captured = runWithAiContext(() => {
      setAiUser('u1');
      setAiTenant('t1');
      return getAiContext();
    });
    expect(captured).toEqual({ userId: 'u1', tenant: 't1' });
  });
  it('fuera de un run, getAiContext devuelve {}', () => {
    expect(getAiContext()).toEqual({});
  });
});

describe('ai/cost/report · aggregateByTenant', () => {
  it('agrupa por tenant, computa costo por modelo y ordena por costo desc', () => {
    const rows = [
      { company_id: 'A', provider: 'claude',   model: 'claude-sonnet-4-6',         calls: 2, input_tokens: 1e6, output_tokens: 0,   cache_read_tokens: 0, cache_write_tokens: 0 },
      { company_id: 'A', provider: 'deepseek',  model: 'deepseek-v4-flash',         calls: 1, input_tokens: 1e6, output_tokens: 0,   cache_read_tokens: 0, cache_write_tokens: 0 },
      { company_id: 'B', provider: 'claude',    model: 'claude-haiku-4-5-20251001', calls: 5, input_tokens: 1e6, output_tokens: 1e6, cache_read_tokens: 0, cache_write_tokens: 0 },
    ];
    const { tenants, totals } = aggregateByTenant(rows, { A: 'Empresa A', B: 'Empresa B' });
    const A = tenants.find(t => t.company_id === 'A');
    const B = tenants.find(t => t.company_id === 'B');
    expect(A.name).toBe('Empresa A');
    expect(A.calls).toBe(3);
    expect(A.costUsd).toBeCloseTo(3.14, 6);   // sonnet 3.0 + v4-flash 0.14
    expect(B.costUsd).toBeCloseTo(6.0, 6);    // haiku 1 (in) + 5 (out)
    expect(tenants[0].company_id).toBe('B');  // ordenado por costo desc
    expect(totals.calls).toBe(8);
    expect(totals.costUsd).toBeCloseTo(9.14, 6);
  });
  it('maneja filas vacías y company_id null', () => {
    expect(aggregateByTenant([]).tenants).toEqual([]);
    const { tenants } = aggregateByTenant([
      { company_id: null, provider: 'claude', model: 'm', calls: 1, input_tokens: 0, output_tokens: 0, cache_read_tokens: 0, cache_write_tokens: 0 },
    ]);
    expect(tenants[0].company_id).toBeNull();
  });
});

describe('ai/policy · resolve (invariante PII-lock)', () => {
  it('las tareas con PII de CV resuelven SIEMPRE a Claude', () => {
    for (const t of ['cv.optimize', 'cv.match', 'cv.carta', 'cv.infografia', 'cv.extractProfile', 'linkedin.extraer', 'interview.preguntas']) {
      const r = resolve(t);
      expect(r.provider).toBe('claude');
      expect(r.piiLock).toBe(true);
    }
  });
  it('las tareas sin PII resuelven a DeepSeek en el aterrizaje', () => {
    for (const t of ['cv.resumen.optimizar', 'cv.resumen.fusionar', 'cv.descripcionExp', 'cv.corregirProyecto', 'linkedin.analizar', 'interview.evaluar', 'mentor.chat']) {
      const r = resolve(t);
      expect(r.provider).toBe('deepseek');
      expect(r.piiLock).toBe(false);
    }
  });
  it('una task desconocida tira', () => {
    expect(() => resolve('no.existe')).toThrow();
  });
});
