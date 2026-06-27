// cv.routes — solo wiring de la Factoría Harvard (optimize, match, generar, etc.).
const express = require('express');
const router = express.Router();

const auth = require('../../middleware/auth');
const { dailyCap } = require('../../middleware/dailyCap');
const { validate } = require('../../middleware/validate');
const { optimize: optimizeSchema } = require('./cv.schemas');
const upload = require('../../middleware/upload');
const { limiterOptimize, limiterMatch, limiterResumen } = require('../../middleware/rateLimiter');
const {
  optimize, matchToJob, download, extractProfile, generarInfografia,
  generarInfografiaProyecto, generarCartaPresentacion, optimizarResumen,
  optimizarExp, fusionarResumen, generarOfertaValorIA,
} = require('./cv.controller');
const { generarCV } = require('./cv.generar.controller');

// Optimización de CV — validate corre tras multer (parsea campos del multipart)
router.post('/optimize', auth, limiterOptimize, upload.single('cv'), validate(optimizeSchema), dailyCap, optimize);

// CV vs Vacante
router.post('/match', auth, limiterMatch, upload.single('cv'), dailyCap, matchToJob);

// Descarga del resultado
router.get('/download/:id', auth, download);

// Extrae datos personales del CV para pre-llenar el onboarding
router.post('/extract-profile', auth, upload.single('cv'), extractProfile);

// Genera CV desde formulario estructurado
router.post('/generar', auth, limiterOptimize, dailyCap, generarCV);

// Vista infográfica (JSON estructurado)
router.get('/infografia/:id', auth, generarInfografia);

// Infografía Visual del Proyecto Laboral
router.post('/infografia-proyecto', auth, generarInfografiaProyecto);

// Carta de presentación
router.post('/carta', auth, dailyCap, limiterMatch, generarCartaPresentacion);

// Optimiza el resumen profesional
router.post('/optimizar-resumen', auth, limiterResumen, optimizarResumen);

// Optimiza descripción de experiencia laboral
router.post('/optimizar-experiencia', auth, limiterResumen, optimizarExp);

// Fusiona resumen del CV + Oferta de Valor
router.post('/fusionar-resumen', auth, limiterResumen, fusionarResumen);

// Genera borrador de Oferta de Valor con IA
router.post('/oferta-valor-ia', auth, generarOfertaValorIA);

module.exports = router;
