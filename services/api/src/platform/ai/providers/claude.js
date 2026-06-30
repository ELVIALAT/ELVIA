// Provider Claude (Anthropic). Tiers Haiku/Sonnet + prompt caching opcional del system.
const Anthropic = require('@anthropic-ai/sdk');

let client = null;
const _key = process.env.ANTHROPIC_API_KEY;
if (!_key) {
  console.error('[ai:claude] ANTHROPIC_API_KEY no configurada — provider Claude deshabilitado');
} else {
  try { client = new Anthropic({ apiKey: _key }); }
  catch (e) { console.error('[ai:claude] init error:', e.message); }
}

const name = 'claude';
const isReady = () => !!client;

// Ejecuta una completion. `system` es string (provider-agnóstico); si cacheSystem=true se envía
// como bloque con cache_control ephemeral para que la porción estática se cobre a ~0.1x en relecturas.
async function call({ model, system, messages, maxTokens, temperature, cacheSystem }) {
  if (!client) throw new Error('[ai:claude] ANTHROPIC_API_KEY no configurada');
  const params = { model, max_tokens: maxTokens, messages };
  if (temperature != null) params.temperature = temperature;
  if (system) {
    params.system = cacheSystem
      ? [{ type: 'text', text: system, cache_control: { type: 'ephemeral' } }]
      : system;
  }
  const res = await client.messages.create(params);
  const text = (res.content && res.content[0] && res.content[0].text) || '';
  return { text, usage: res.usage || null };
}

module.exports = { name, call, isReady };
