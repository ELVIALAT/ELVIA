/**
 * resendService.js — FACADE (compatibilidad).
 *
 * La lógica de email se movió a `platform/email/` (client + transactional/waitlist/tenancy/nurture).
 * Este archivo conserva la superficie de exports para no romper los consumidores
 * (cron, tenancy.registration, admin.users, tenancy, tenants, waitlist).
 */
const {
  sendCVEmail,
  sendOTPEmail,
  sendWelcomeWaitlistEmail,
  sendInvitacionEmail,
  sendHRWelcomeEmail,
  sendCandidatoInviteEmail,
  sendBienvenidaActivacionEmail,
  sendOfertaValorCompletadaEmail,
  sendInfografiaGeneradaEmail,
  sendCVOptimizadoCompletadaEmail,
  sendOnboarding1Email,
  sendOnboarding3Email,
  sendRecap7Email,
} = require('../platform/email');

module.exports = {
  sendCVEmail,
  sendOTPEmail,
  sendWelcomeWaitlistEmail,
  sendInvitacionEmail,
  sendHRWelcomeEmail,
  sendCandidatoInviteEmail,
  sendBienvenidaActivacionEmail,
  sendOfertaValorCompletadaEmail,
  sendInfografiaGeneradaEmail,
  sendCVOptimizadoCompletadaEmail,
  sendOnboarding1Email,
  sendOnboarding3Email,
  sendRecap7Email,
};
