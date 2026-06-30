// Provider DeepSeek (API compatible OpenAI). Pluggable: en el aterrizaje atiende el bulk no-PII.
const OpenAI = require('openai');

let client = null;
const _key = process.env.DEEPSEEK_API_KEY;
if (!_key) {
  console.error('[ai:deepseek] DEEPSEEK_API_KEY no configurada — provider DeepSeek deshabilitado');
} else {
  try { client = new OpenAI({ apiKey: _key, baseURL: 'https://api.deepseek.com/v1' }); }
  catch (e) { console.error('[ai:deepseek] init error:', e.message); }
}

const name = 'deepseek';
const isReady = () => !!client;

// DeepSeek no tiene `system` aparte: se antepone como primer mensaje role:system (igual que el código vivo).
async function call({ model, system, messages, maxTokens, temperature }) {
  if (!client) throw new Error('[ai:deepseek] DEEPSEEK_API_KEY no configurada');
  const msgs = system ? [{ role: 'system', content: system }, ...messages] : messages;
  const params = { model, max_tokens: maxTokens, messages: msgs };
  if (temperature != null) params.temperature = temperature;
  const res = await client.chat.completions.create(params);
  const text = (res.choices && res.choices[0] && res.choices[0].message.content) || '';
  return { text, usage: res.usage || null };
}

module.exports = { name, call, isReady };
