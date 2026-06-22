const express = require('express')
const router  = express.Router()
const auth    = require('../middleware/auth')
const { limiterOptimize } = require('../middleware/rateLimiter')
const { generarPreguntas, evaluar } = require('../controllers/interviewController')

router.post('/preguntas', auth, limiterOptimize, generarPreguntas)
router.post('/evaluar',   auth, limiterOptimize, evaluar)

module.exports = router
