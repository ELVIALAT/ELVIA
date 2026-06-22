// Rutas para operaciones de CV
const express = require('express');
const router = express.Router();

const auth                  = require('../middleware/auth');
const { dailyCap }          = require('../middleware/dailyCap');
const upload                = require('../middleware/upload');
const { limiterOptimize, limiterMatch, limiterResumen } = require('../middleware/rateLimiter');
const { optimize, matchToJob, download, extractProfile, generarInfografia, generarInfografiaProyecto, generarCartaPresentacion, optimizarResumen, optimizarExp, fusionarResumen, generarOfertaValorIA } = require('../controllers/cvController')
const { generarCV } = require('../controllers/cvGenerarController')

// Optimización de CV — dailyCap va DESPUÉS de upload para no consumir slot con archivos inválidos
router.post('/optimize', auth, limiterOptimize, upload.single('cv'), dailyCap, optimize);

// CV vs Vacante — usuario → rate → upload → dailyCap
router.post('/match', auth, limiterMatch, upload.single('cv'), dailyCap, matchToJob);

// Descarga del resultado
router.get('/download/:id', auth, download);

// Extrae datos personales del CV para pre-llenar el onboarding (no consume crédito)
router.post('/extract-profile', auth, upload.single('cv'), extractProfile);

// Genera CV desde formulario estructurado — dailyCap al final tras validaciones
router.post('/generar', auth, limiterOptimize, dailyCap, generarCV);

// Genera JSON estructurado para la vista infográfica
router.get('/infografia/:id', auth, generarInfografia);

// Genera la Infografía Visual del Proyecto Laboral (Corrección Ortográfica + DB Persist)
router.post('/infografia-proyecto', auth, generarInfografiaProyecto);

// Carta de presentación para una vacante (consume dailyCap, auth requerido)
router.post('/carta', auth, dailyCap, limiterMatch, generarCartaPresentacion);

// Optimiza el resumen profesional (tono humano, ortografía, estructura)
router.post('/optimizar-resumen', auth, limiterResumen, optimizarResumen);

// Optimiza descripción de una experiencia laboral (STAR + verbos de acción)
router.post('/optimizar-experiencia', auth, limiterResumen, optimizarExp);

// Path A — Fusiona resumen del CV original + Mi Oferta de Valor en un solo resumen ATS-optimizado
router.post('/fusionar-resumen', auth, limiterResumen, fusionarResumen);

// Genera borrador de Oferta de Valor con IA (Ikigai + Competencias → síntesis)
router.post('/oferta-valor-ia', auth, generarOfertaValorIA);

module.exports = router;
