// linkedin.routes — solo wiring.
const express = require('express');
const multer = require('multer');
const router = express.Router();
const auth = require('../../middleware/auth');
const { validate } = require('../../middleware/validate');
const { limiterOptimize } = require('../../middleware/rateLimiter');
const schemas = require('./linkedin.schemas');
const ctrl = require('./linkedin.controller');

// Multer en memoria para el PDF de LinkedIn (5MB, solo PDF).
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    if (file.mimetype === 'application/pdf') cb(null, true);
    else cb(new Error('Solo se permiten archivos PDF'));
  },
});

router.post('/analizar',        auth, validate(schemas.analizar), limiterOptimize, ctrl.analizarPerfil);
router.get('/historial',        auth, ctrl.getHistorial);
router.get('/uso-mes',          auth, ctrl.getUsoMes);
router.post('/extraer-pdf',     auth, limiterOptimize, upload.single('pdf'), ctrl.extraerPerfilPDF);
router.post('/guardar-reporte', auth, validate(schemas.guardarReporte), ctrl.guardarReporte);
router.get('/ultimo-analisis',  auth, ctrl.getUltimoAnalisis);

module.exports = router;
