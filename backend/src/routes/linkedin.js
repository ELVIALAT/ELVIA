const express = require('express')
const router  = express.Router()
const multer  = require('multer')
const auth    = require('../middleware/auth')
const { limiterOptimize } = require('../middleware/rateLimiter')
const { analizarPerfil, extraerPerfilPDF, getHistorial, guardarReporte, getUsoMes, getUltimoAnalisis } = require('../controllers/linkedinController')

// Configuración de Multer para recibir PDF en memoria
const storage = multer.memoryStorage()
const upload  = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // Limite de 5MB
  fileFilter: (req, file, cb) => {
    if (file.mimetype === 'application/pdf') cb(null, true)
    else cb(new Error('Solo se permiten archivos PDF'))
  }
})

router.post('/analizar',      auth, limiterOptimize, analizarPerfil)

// Historial de análisis del usuario
router.get('/historial',      auth, getHistorial)

// Uso del mes
router.get('/uso-mes',        auth, getUsoMes)

// Extracción de PDF de LinkedIn
router.post('/extraer-pdf',   auth, limiterOptimize, upload.single('pdf'), extraerPerfilPDF)

// Guardar reporte LinkedIn en Mis Documentos — UPSERT (un registro por usuario)
router.post('/guardar-reporte', auth, guardarReporte)

// Último análisis guardado — para precargar el formulario
router.get('/ultimo-analisis', auth, getUltimoAnalisis)

module.exports = router
