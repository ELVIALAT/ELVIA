// Schemas Zod del módulo interview.
const { z } = require('zod');

const generarPreguntas = z.object({
  cargo: z.string().trim().min(1, 'el cargo es requerido').max(200),
  empresa: z.string().trim().max(200).optional(),
  entrevistador: z.string().trim().max(80).optional(),
  descripcion: z.string().max(10000).optional(),
  numPreguntas: z.coerce.number().int().min(1).max(50).optional(),
  cv_base: z.string().max(50000).optional(),
});

const evaluar = z.object({
  cargo: z.string().trim().max(200).optional(),
  empresa: z.string().trim().max(200).optional(),
  entrevistador: z.string().trim().max(80).optional(),
  preguntas: z.array(z.string().max(2000)).min(1, 'faltan preguntas'),
  respuestas: z.array(z.string().max(20000)).min(1, 'faltan respuestas'),
  feedbackPorPregunta: z.boolean().optional(),
});

const tts = z.object({
  text: z.string().trim().min(1, 'texto requerido').max(4000),
  voice: z.enum(['alloy', 'echo', 'fable', 'onyx', 'nova', 'shimmer']).optional(),
});

module.exports = { generarPreguntas, evaluar, tts };
