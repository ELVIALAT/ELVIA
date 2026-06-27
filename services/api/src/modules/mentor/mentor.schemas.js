// Schemas Zod del módulo mentor.
const { z } = require('zod');

const historyItem = z.object({
  role: z.string().max(20).optional(),
  content: z.string().max(5000).optional(),
}).passthrough();

const chat = z.object({
  message: z.string().trim().min(1, 'el mensaje es requerido').max(2000, 'máximo 2000 caracteres'),
  context: z.any().optional(),
  history: z.array(historyItem).optional(),
});

const manualChat = z.object({
  message: z.string().trim().min(1, 'el mensaje es requerido').max(1000, 'máximo 1000 caracteres'),
  history: z.array(historyItem).optional(),
});

module.exports = { chat, manualChat };
