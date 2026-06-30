/**
 * deepseekService.js — FACADE (compatibilidad).
 *
 * La lógica de IA se movió al router en `platform/ai/` (tasks + policy + providers + cost).
 * Este archivo conserva la superficie de exports para no romper imports existentes
 * (cv.controller, interview.service, linkedin.service, mentor.service) ni los `jest.mock`.
 *
 * El routing real ahora lo decide la POLÍTICA (platform/ai/policy.js):
 *   - Tareas con PII de CV → Claude (Haiku extracción / Sonnet premium), nunca DeepSeek.
 *   - Tareas sin PII → DeepSeek en el aterrizaje (flip a Claude por config: AI_NONPII_PROVIDER=claude).
 *
 * El nombre "deepseekService" es legacy; los consumidores se migrarán a importar de
 * `platform/ai` directamente en un paso posterior, y este facade se eliminará.
 */
const {
  // CV
  optimizeCV,
  matchCVtoJob,
  extraerDatosInfografia,
  corregirProyectoLaboral,
  generarCarta,
  optimizarResumen,
  fusionarResumen,
  optimizarDescripcionExp,
  extractProfileFromCV,
  // Entrevista
  generarPreguntasEntrevista,
  evaluarEntrevista,
  // LinkedIn
  analizarLinkedin,
  extraerDatosLinkedin,
  // Chat
  generateChatResponse,
} = require('../platform/ai/tasks');

module.exports = {
  generateChatResponse,
  generarPreguntasEntrevista,
  extraerDatosInfografia,
  extraerDatosLinkedin,
  analizarLinkedin,
  corregirProyectoLaboral,
  extractProfileFromCV,
  optimizarResumen,
  fusionarResumen,
  optimizarDescripcionExp,
  generarCarta,
  evaluarEntrevista,
  optimizeCV,
  matchCVtoJob,
};
