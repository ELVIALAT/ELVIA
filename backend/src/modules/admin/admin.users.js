// admin.users — borrado permanente de usuarios (GDPR), gated por OTP enviado al
// email del admin. Solo super_admin. Dos pasos:
//   1) POST /users/delete-otp-request/:id → genera y envía OTP al admin.
//   2) DELETE /users/:id (con otp en body) → valida OTP, audita y borra.
//
// Registra en deletion_audit_log (hash SHA256 del email) ANTES de borrar, para
// compliance legal.

const express = require('express')
const crypto = require('crypto')
const auth = require('../../middleware/auth')
const requireRole = require('../../middleware/requireAdmin')
const { supabaseAdmin } = require('../../lib/supabase')
const { createOTP, validateOTP } = require('../../services/otpService')
const { sendOTPEmail } = require('../../services/resendService')

const router = express.Router()

// ── Paso 1: solicitar OTP ──────────────────────────────────────────────────
router.post('/users/delete-otp-request/:id', auth, requireRole('super_admin'), async (req, res) => {
  const targetId = req.params.id

  // Evitar que un admin se borre a sí mismo.
  if (targetId === req.user.id) {
    return res.status(400).json({ error: 'No puedes eliminar tu propia cuenta desde el admin.' })
  }

  // Verificar que el usuario a borrar existe.
  const { data: targetUser, error: userError } = await supabaseAdmin.auth.admin.getUserById(targetId)
  if (userError || !targetUser) {
    return res.status(404).json({ error: 'Usuario no encontrado' })
  }

  const otp = createOTP(req.user.id, req.user.email)

  try {
    await sendOTPEmail(req.user.email, otp, targetUser.user_metadata?.email || 'Usuario desconocido')
    res.json({
      ok: true,
      message: 'Código OTP enviado a tu email. Válido por 10 minutos.',
      targetEmail: targetUser.user_metadata?.email || 'Usuario desconocido',
    })
  } catch (err) {
    console.error('[Admin] Error enviando OTP:', err.message)
    res.status(500).json({ error: 'No se pudo enviar el OTP. Intenta de nuevo.' })
  }
})

// ── Paso 2: borrar (requiere OTP válido) ───────────────────────────────────
router.delete('/users/:id', auth, requireRole('super_admin'), async (req, res) => {
  const { data: profile } = await req.supabase
    .from('profiles')
    .select('email_principal')
    .eq('id', req.user.id)
    .single()

  const targetId = req.params.id
  const { otp } = req.body

  // Evitar auto-borrado.
  if (targetId === req.user.id) {
    return res.status(400).json({ error: 'No puedes eliminar tu propia cuenta desde el admin.' })
  }

  // Validar OTP.
  const otpValidation = validateOTP(req.user.id, otp)
  if (!otpValidation.valid) {
    return res.status(403).json({ error: otpValidation.error })
  }

  // Datos del usuario a borrar (para audit log).
  const { data: targetUser, error: userError } = await supabaseAdmin.auth.admin.getUserById(targetId)
  if (userError || !targetUser) {
    return res.status(404).json({ error: 'Usuario no encontrado' })
  }

  try {
    // Hash SHA256 del email (GDPR).
    const emailHash = crypto.createHash('sha256').update(targetUser.email).digest('hex')
    const emailDomain = targetUser.email.split('@')[1]

    // Audit log ANTES de borrar (por si falla el borrado).
    const { error: auditError } = await supabaseAdmin
      .from('deletion_audit_log')
      .insert({
        deleted_user_id: targetId,
        deleted_user_email_hash: emailHash,
        deleted_user_email_domain: emailDomain,
        admin_id: req.user.id,
        admin_email: profile.email_principal,
        status: 'completed',
        completed_at: new Date().toISOString(),
      })

    if (auditError) {
      console.error('[Admin] Error registrando audit log:', auditError.message)
      return res.status(500).json({
        error: 'Error al procesar solicitud. Contacta a soporte.',
        errorCode: 'AUDIT_LOG_FAILED',
      })
    }

    // Borrar usuario (cascade a profiles por FK).
    const { error: deleteError } = await supabaseAdmin.auth.admin.deleteUser(targetId)

    if (deleteError) {
      console.error('[Admin] Error eliminando usuario:', deleteError.message)
      console.error('[Admin] Full error:', deleteError)
      await supabaseAdmin
        .from('deletion_audit_log')
        .update({ status: 'failed' })
        .eq('deleted_user_id', targetId)
        .catch(err => console.error('[Admin] Error updating audit log:', err))

      return res.status(500).json({
        error: 'Error al eliminar usuario. Contacta a soporte.',
        errorCode: 'DELETE_USER_FAILED',
      })
    }

    console.log(`[Admin] Usuario ${targetId} eliminado por ${req.user.id}`)
    res.json({ ok: true, deleted: targetId, audited: true })
  } catch (err) {
    console.error('[Admin] Error en proceso de eliminación:', err.message)
    res.status(500).json({ error: 'Error inesperado durante la eliminación' })
  }
})

module.exports = router
