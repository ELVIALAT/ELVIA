// backend/tests/claudeManualService.test.js
jest.mock('@anthropic-ai/sdk');

const Anthropic = require('@anthropic-ai/sdk');
const mockCreate = jest.fn();
Anthropic.mockImplementation(() => ({ messages: { create: mockCreate } }));

process.env.ANTHROPIC_API_KEY = 'test-key';
process.env.MANUAL_PATH = require('path').join(__dirname, '..', 'data', 'manual-elvia.md');

const { responderConManual } = require('../src/services/claudeManualService');

describe('claudeManualService.responderConManual', () => {
  beforeEach(() => { mockCreate.mockReset(); });

  test('llama a Claude Haiku con system prompt cacheado que contiene el manual', async () => {
    mockCreate.mockResolvedValue({
      content: [{ text: JSON.stringify({
        respuesta: 'Para guardar tu CV ve a Mis Documentos.',
        citas: [{ seccion: 'Módulo 6: Mis Documentos', anchor: 'modulo-6-mis-documentos' }],
        requiere_escalamiento: false
      }) }],
      usage: { input_tokens: 100, output_tokens: 50 }
    });

    const out = await responderConManual({
      question: '¿Dónde veo mi CV?',
      userContext: { isB2B: false, tenantSlug: null }
    });

    expect(mockCreate).toHaveBeenCalledTimes(1);
    const call = mockCreate.mock.calls[0][0];
    expect(call.model).toMatch(/haiku/);
    expect(Array.isArray(call.system)).toBe(true);
    const manualBlock = call.system.find(b => b.cache_control);
    expect(manualBlock).toBeDefined();
    expect(manualBlock.cache_control).toEqual({ type: 'ephemeral' });
    expect(out.respuesta).toContain('Mis Documentos');
    expect(out.citas).toHaveLength(1);
    expect(out.requiere_escalamiento).toBe(false);
  });

  test('inyecta instruccion B2B cuando isB2B=true', async () => {
    mockCreate.mockResolvedValue({
      content: [{ text: JSON.stringify({ respuesta: 'ok', citas: [], requiere_escalamiento: false }) }],
      usage: {}
    });

    await responderConManual({
      question: 'test',
      userContext: { isB2B: true, tenantSlug: 'telefonica' }
    });

    const call = mockCreate.mock.calls[0][0];
    const sysText = call.system.map(b => b.text).join('\n');
    expect(sysText).toMatch(/B2B/);
    expect(sysText).toMatch(/telefonica/i);
    expect(sysText).toMatch(/Omite menciones a limites de cuenta demo/);
  });

  test('si Claude devuelve texto no-JSON, retorna respuesta cruda con citas vacias', async () => {
    mockCreate.mockResolvedValue({
      content: [{ text: 'Respuesta plana sin JSON.' }],
      usage: {}
    });

    const out = await responderConManual({
      question: 'test',
      userContext: { isB2B: false }
    });

    expect(out.respuesta).toBe('Respuesta plana sin JSON.');
    expect(out.citas).toEqual([]);
    expect(out.requiere_escalamiento).toBe(false);
  });
});
