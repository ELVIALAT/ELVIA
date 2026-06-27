// backend/src/middleware/manualChatLimit.js
// Doble límite: 10/minuto y 20/día por usuario.
// In-memory, suficiente para 1 instancia Railway. Migrar a Redis si escala.

const minuteWindow = new Map();
const dayWindow = new Map();

const MAX_PER_MINUTE = 10;
const MAX_PER_DAY = 20;
const MIN_WINDOW = 60 * 1000;
const DAY_WINDOW = 24 * 60 * 60 * 1000;

function bumpWindow(map, userId, windowMs) {
  const now = Date.now();
  const entry = map.get(userId) || { count: 0, firstAt: now };
  if (now - entry.firstAt > windowMs) {
    entry.count = 1;
    entry.firstAt = now;
  } else {
    entry.count += 1;
  }
  map.set(userId, entry);
  return entry;
}

function manualChatLimit(req, res, next) {
  const userId = req.user?.id;
  if (!userId) {
    return res.status(401).json({ error: 'No autorizado' });
  }

  const minute = bumpWindow(minuteWindow, userId, MIN_WINDOW);
  if (minute.count > MAX_PER_MINUTE) {
    return res.status(429).json({
      error: 'RATE_LIMIT_MINUTE',
      reply: 'Estás preguntando muy rápido. Espera 1 minuto y vuelve a intentarlo.',
    });
  }

  const day = bumpWindow(dayWindow, userId, DAY_WINDOW);
  if (day.count > MAX_PER_DAY) {
    return res.status(429).json({
      error: 'RATE_LIMIT_DAY',
      reply: `Llegaste al máximo diario de ${MAX_PER_DAY} consultas al manual. Vuelve mañana o consulta a un mentor experto.`,
    });
  }

  next();
}

module.exports = manualChatLimit;
