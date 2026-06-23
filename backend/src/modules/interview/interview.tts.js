// interview.tts — voz premium del entrevistador vía OpenAI TTS.
// Reemplaza speechSynthesis del browser (robótico) por una voz natural.
// Costo ~$0.015/1K chars (~$0.90/h de habla). Degrada si falta la API key.
const OpenAI = require('openai');

let _client = null, _init = false;
function getClient() {
  if (_init) return _client;
  _init = true;
  const key = process.env.OPENAI_API_KEY;
  if (!key) { console.error('[interview.tts] OPENAI_API_KEY no configurada — TTS premium deshabilitado'); return null; }
  try { _client = new OpenAI({ apiKey: key }); }
  catch (err) { console.error('[interview.tts] init:', err.message); }
  return _client;
}

// Voz por defecto del entrevistador. 'onyx' (masculina seria) / 'nova' (femenina cálida).
const DEFAULT_VOICE = process.env.INTERVIEW_TTS_VOICE || 'onyx';
const ALLOWED_VOICES = ['alloy', 'echo', 'fable', 'onyx', 'nova', 'shimmer'];
const MAX_CHARS = 4000; // tope de seguridad por request

class TtsError extends Error { constructor(m, code) { super(m); this.code = code; } }

// Genera audio (mp3) del texto. Devuelve un Buffer.
async function synthesize(text, voice = DEFAULT_VOICE) {
  const client = getClient();
  if (!client) throw new TtsError('Servicio de voz no disponible', 'TTS_DISABLED');

  const safeText = String(text || '').trim().slice(0, MAX_CHARS);
  if (!safeText) throw new TtsError('Texto vacío', 'EMPTY');
  const safeVoice = ALLOWED_VOICES.includes(voice) ? voice : DEFAULT_VOICE;

  const response = await client.audio.speech.create({
    model: 'tts-1',          // tts-1 (rápido/barato) vs tts-1-hd (más caro)
    voice: safeVoice,
    input: safeText,
    response_format: 'mp3',
    speed: 1.0,
  });
  return Buffer.from(await response.arrayBuffer());
}

module.exports = { synthesize, TtsError, ALLOWED_VOICES, DEFAULT_VOICE };
