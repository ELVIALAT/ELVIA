// Contexto de usuario — acceso full para todos (ELVIA B2B puro, sin planes).
// Solo verifica que el usuario no esté suspendido. El modelo freemium/planes
// fue eliminado el 2026-06-22 (ver docs/legacy/freemium-model.md).

const planContext = async (req, res, next) => {
  const userId = req.user.id;
  const db = req.supabase;

  const { data, error } = await db
    .from('profiles')
    .select('suspended, company_id')
    .eq('id', userId)
    .maybeSingle();

  if (error) {
    return res.status(500).json({ error: 'Error al verificar el usuario' });
  }

  if (data?.suspended) {
    return res.status(403).json({
      error: 'ACCOUNT_SUSPENDED',
      mensaje: 'Tu cuenta ha sido suspendida. Contacta a soporte.',
    });
  }

  // Acceso completo para todos los usuarios autenticados.
  req.planInfo = {
    isPaidPlan: true,
    company_id: data?.company_id || null,
  };

  next();
};

module.exports = { planContext };
