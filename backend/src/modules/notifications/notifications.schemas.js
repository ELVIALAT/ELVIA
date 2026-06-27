// Schemas Zod del módulo notifications.
const { z } = require('zod');

const sendCv = z.object({
  to: z.string().trim().toLowerCase().email('correo inválido').max(254),
  cvId: z.string().uuid(),
  format: z.enum(['pdf', 'word']).optional().default('pdf'),
});

module.exports = { sendCv };
