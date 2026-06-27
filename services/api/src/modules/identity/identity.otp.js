// identity.otp — generación y validación de códigos OTP para operaciones
// sensibles (hoy: borrado de usuario por super_admin). Primitivo de identidad
// reutilizable (movido desde services/otpService.js en la modularización F2).
//
// ⚠️ Almacenamiento en memoria — IMPORTANTE: usar Redis en producción
// (no sobrevive reinicios ni escala horizontalmente).

const crypto = require('crypto');

const otpStore = new Map();
const OTP_EXPIRY_MINUTES = 10;

// Genera un código OTP aleatorio de 6 dígitos.
const generateOTP = () => {
  return crypto.randomInt(100000, 999999).toString();
};

// Almacena un OTP para un admin con expiración. Devuelve el código generado.
const createOTP = (adminId, adminEmail) => {
  const code = generateOTP();
  const expiresAt = Date.now() + OTP_EXPIRY_MINUTES * 60 * 1000;

  otpStore.set(adminId, {
    code,
    email: adminEmail,
    expiresAt,
    attempts: 0,
  });

  return code;
};

// Valida un OTP. Devuelve { valid: boolean, error?: string }.
const validateOTP = (adminId, code) => {
  const stored = otpStore.get(adminId);

  if (!stored) {
    return { valid: false, error: 'OTP no solicitado o expirado' };
  }

  if (Date.now() > stored.expiresAt) {
    otpStore.delete(adminId);
    return { valid: false, error: 'OTP expirado. Solicita uno nuevo.' };
  }

  stored.attempts++;
  if (stored.attempts > 5) {
    otpStore.delete(adminId);
    return { valid: false, error: 'Demasiados intentos. Solicita un nuevo OTP.' };
  }

  if (stored.code !== code) {
    return { valid: false, error: 'Código OTP incorrecto.' };
  }

  // OTP validado — borramos del almacén.
  otpStore.delete(adminId);
  return { valid: true };
};

module.exports = {
  generateOTP,
  createOTP,
  validateOTP,
};
