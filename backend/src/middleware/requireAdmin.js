// Middleware factory para verificar roles de admin — adaptador Express fino
// sobre identity.service. La resolución de rol (queries a administrators/profiles/
// companies) vive ahora en modules/identity (testeable, reutilizable); aquí solo
// queda el gating HTTP por minRole.
//
// Uso: router.get('/ruta', auth, requireRole('super_admin'), handler)
//      router.get('/ruta', auth, requireRole('company_admin'), handler)

const { resolveAdminContext } = require('../modules/identity/identity.service');

const requireRole = (minRole = 'company_admin') => async (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({ error: 'No autenticado' });
  }

  try {
    const ctx = await resolveAdminContext(req.supabase, req.user.id);

    if (!ctx.role) {
      return res.status(403).json({ error: 'Acceso denegado' });
    }

    // Exponer el flag de MFA del tenant para que requireMFA pueda actuar.
    if (ctx.mfaRequired) req.companyRequiresMFA = true;

    // Super admin siempre puede.
    if (ctx.role === 'super_admin') {
      req.adminRole = 'super_admin';
      req.companyId = null;
      req.adminProfile = ctx.profile;
      return next();
    }

    // Company admin solo para rutas que no exigen super_admin.
    if (ctx.role === 'company_admin' && minRole === 'company_admin') {
      req.adminRole = 'company_admin';
      req.companyId = ctx.companyId;
      req.adminProfile = ctx.profile;
      return next();
    }

    res.status(403).json({ error: 'Acceso denegado. Permisos insuficientes.' });
  } catch (err) {
    console.error('[requireRole] Error:', err);
    res.status(500).json({ error: 'Error verificando permisos' });
  }
};

module.exports = requireRole;
