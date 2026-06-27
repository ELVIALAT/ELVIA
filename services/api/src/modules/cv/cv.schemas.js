// Schemas Zod del módulo cv.
const { z } = require('zod');

// /optimize y /match son multipart (archivo + campos de texto); el archivo va
// por multer, aquí solo los campos. passthrough porque multer añade campos.
const optimize = z.object({
  language: z.enum(['es', 'en']).optional().default('es'),
  jobText: z.string().max(20000).optional(),
  cvId: z.string().uuid().optional(),
}).passthrough();

module.exports = { optimize };
