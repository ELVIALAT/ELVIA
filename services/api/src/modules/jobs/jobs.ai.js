// jobs.ai — clientes de IA del módulo jobs (singletons, degradan si falta key).
// DeepSeek: búsqueda/filtrado (no toca PII). Claude: compatibilidad CV (maneja PII, DPA Anthropic).
const OpenAI = require('openai');
const Anthropic = require('@anthropic-ai/sdk');

const DS_MODEL = 'deepseek-chat';

let _deepseek = null, _dsInit = false;
function getDeepseek() {
  if (_dsInit) return _deepseek;
  _dsInit = true;
  const key = process.env.DEEPSEEK_API_KEY;
  if (!key) { console.error('[jobs.ai] DEEPSEEK_API_KEY no configurada — búsqueda IA deshabilitada'); return null; }
  try { _deepseek = new OpenAI({ apiKey: key, baseURL: 'https://api.deepseek.com/v1' }); }
  catch (err) { console.error('[jobs.ai] DeepSeek init:', err.message); }
  return _deepseek;
}

let _claude = null, _clInit = false;
function getClaude() {
  if (_clInit) return _claude;
  _clInit = true;
  const key = process.env.ANTHROPIC_API_KEY;
  if (!key) { console.error('[jobs.ai] ANTHROPIC_API_KEY no configurada — compatibilidad deshabilitada'); return null; }
  try { _claude = new Anthropic({ apiKey: key }); }
  catch (err) { console.error('[jobs.ai] Claude init:', err.message); }
  return _claude;
}

module.exports = { DS_MODEL, getDeepseek, getClaude };
