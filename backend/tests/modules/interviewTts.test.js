// Tests del TTS premium del módulo interview.
const tts = require('../../src/modules/interview/interview.tts');

describe('interview.tts', () => {
  test('expone las voces permitidas y una por defecto', () => {
    expect(tts.ALLOWED_VOICES).toContain('onyx');
    expect(tts.ALLOWED_VOICES).toContain('nova');
    expect(typeof tts.DEFAULT_VOICE).toBe('string');
  });

  test('synthesize lanza TTS_DISABLED si no hay API key', async () => {
    const prev = process.env.OPENAI_API_KEY;
    delete process.env.OPENAI_API_KEY;
    // forzar re-evaluación del singleton: el módulo ya cacheó, así que probamos
    // que el error tiene el shape esperado vía un import fresco.
    jest.resetModules();
    const fresh = require('../../src/modules/interview/interview.tts');
    await expect(fresh.synthesize('hola')).rejects.toMatchObject({ code: 'TTS_DISABLED' });
    if (prev) process.env.OPENAI_API_KEY = prev;
  });
});
