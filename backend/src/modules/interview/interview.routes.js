// interview.routes — solo wiring.
const express = require('express');
const router = express.Router();
const auth = require('../../middleware/auth');
const { validate } = require('../../middleware/validate');
const { limiterOptimize } = require('../../middleware/rateLimiter');
const schemas = require('./interview.schemas');
const ctrl = require('./interview.controller');

router.post('/preguntas', auth, validate(schemas.generarPreguntas), limiterOptimize, ctrl.generarPreguntas);
router.post('/evaluar',   auth, validate(schemas.evaluar), limiterOptimize, ctrl.evaluar);

module.exports = router;
