// Middleware para hard cap diario de análisis con Claude API.
// ADR-004: caps en 3 dimensiones (global / per-tenant / per-user) vía RPC atómica,
// para que el tenant genérico no sea vector de DoS económico entre usuarios B2C.
const { supabaseAdmin } = require('../lib/supabase');
const { setAiTenant } = require('../platform/ai/context');

// Mensajes por dimensión que bloqueó (no filtrar detalles de otros usuarios/tenants).
const BLOCK_MESSAGES = {
  global: 'El servicio alcanzó su capacidad diaria de análisis. Intenta mañana.',
  tenant: 'Tu organización alcanzó su límite diario de análisis. Intenta mañana o contacta a tu administrador.',
  user:   'Alcanzaste tu límite diario de análisis. Intenta de nuevo mañana.',
};

const dailyCap = async (req, res, next) => {
  if (!supabaseAdmin) {
    console.warn('[Daily Cap] Supabase no disponible, permitiendo análisis');
    return next();
  }

  try {
    const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
    const userId = req.user?.id || null;

    // Resolver company_id del usuario (para el cap per-tenant)
    let companyId = null;
    if (userId) {
      const { data: profile } = await supabaseAdmin
        .from('profiles')
        .select('company_id')
        .eq('id', userId)
        .maybeSingle();
      companyId = profile?.company_id || null;
    }
    setAiTenant(companyId); // reusa el company_id ya resuelto para el ledger de costo de IA

    // Incremento atómico multi-dimensión: check + insert/update de las 3 dimensiones
    const { data, error } = await supabaseAdmin.rpc('increment_daily_cap_v2', {
      p_date: today,
      p_company_id: companyId,
      p_user_id: userId,
    });

    if (error) {
      // Si la RPC no existe (ej. primer deploy), degradar con gracia
      console.error('[Daily Cap] RPC error — permitiendo análisis:', error.message);
      req.dailyCapDate = today;
      return next();
    }

    const result = data?.[0];

    if (!result?.allowed) {
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      const scope = result?.blocked_scope || 'global';
      return res.status(429).json({
        error: BLOCK_MESSAGES[scope] || BLOCK_MESSAGES.global,
        scope,
        retryAfter: tomorrow.toISOString().split('T')[0],
      });
    }

    req.dailyCapDate = today;
    next();
  } catch (err) {
    console.error('[Daily Cap] Middleware error:', err);
    // Graceful degradation: no bloquear al usuario si hay error inesperado
    next();
  }
};

// Mantenido por compatibilidad con controladores que lo llamen directamente.
// Con la RPC atómica el incremento ya ocurrió en el middleware — esta función es no-op.
const incrementDailyCap = async (_date) => {
  // No-op: el incremento se realiza atómicamente en dailyCap()
};

module.exports = { dailyCap, incrementDailyCap };
