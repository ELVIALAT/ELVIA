// Schemas Zod del módulo linkedin.
const { z } = require('zod');

const seccion = z.string().max(20000).optional();

// POST /analizar — al menos una sección la valida el service (regla de negocio).
const analizar = z.object({
  titular: seccion,
  extracto: seccion,
  experiencia: seccion,
  habilidades: seccion,
  idiomas: seccion,
  educacion: seccion,
  contextoLaboral: z.string().max(5000).optional(),
});

// POST /guardar-reporte
const guardarReporte = z.object({
  analisis: z.object({}).passthrough(),
  editables: z.any().optional(),
  original: z.any().optional(),
  filename: z.string().max(200).optional(),
});

module.exports = { analizar, guardarReporte };
