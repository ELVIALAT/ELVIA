// interview.controller — capa HTTP. Delega al service y mapea errores.
const svc = require('./interview.service');
const tts = require('./interview.tts');

// POST /api/interview/tts — voz premium del entrevistador (devuelve audio mp3).
async function speak(req, res, next) {
  try {
    const { text, voice } = req.body; // validado por Zod
    const audio = await tts.synthesize(text, voice);
    res.setHeader('Content-Type', 'audio/mpeg');
    res.setHeader('Content-Length', audio.length);
    res.setHeader('Cache-Control', 'no-store');
    return res.send(audio);
  } catch (err) {
    if (err.code === 'TTS_DISABLED') return res.status(503).json({ error: err.message });
    if (err.code === 'EMPTY') return res.status(400).json({ error: err.message });
    console.error('[interview/tts]', err.message);
    return res.status(500).json({ error: 'No se pudo generar la voz' });
  }
}

async function generarPreguntas(req, res, next) {
  try {
    return res.json(await svc.generarPreguntas(req.body));
  } catch (err) {
    if (err.code === 'VALIDATION') return res.status(400).json({ error: err.message });
    next(err);
  }
}

async function evaluar(req, res, next) {
  try {
    return res.json(await svc.evaluar(req.supabase, req.user?.id, req.body));
  } catch (err) {
    if (err.code === 'VALIDATION') return res.status(400).json({ error: err.message });
    next(err);
  }
}

module.exports = { generarPreguntas, evaluar, speak };
