// Middleware de autenticación — adaptador Express fino sobre el módulo identity.
// Verifica el JWT de Supabase (vía identity.service) y adjunta user/cliente.
const { supabase, crearClienteAutenticado } = require('../lib/supabase');
const { authenticate } = require('../modules/identity/identity.service');

const auth = async (req, res, next) => {
  if (!supabase) {
    return res.status(500).json({ error: 'Backend mal configurado: Supabase no inicializado' });
  }
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Token no proporcionado' });
  }

  const token = authHeader.split(' ')[1];

  // identity.service valida la firma del JWT y resuelve el usuario.
  const { user, error } = await authenticate(token);

  if (error || !user) {
    return res.status(401).json({ error: 'Token inválido o expirado' });
  }

  // Adjuntar usuario y cliente autenticado a la request.
  // req.supabase tiene el contexto del usuario → RLS funciona correctamente.
  req.user = user;
  req.token = token;
  req.supabase = crearClienteAutenticado(token);
  next();
};

module.exports = auth;
