// jobs.routes — solo wiring.
const express = require('express');
const router = express.Router();
const auth = require('../../middleware/auth');
const { validate } = require('../../middleware/validate');
const schemas = require('./jobs.schemas');
const ctrl = require('./jobs.controller');

// POST /api/jobs/fetch-url — descarga texto de una vacante (SSRF-safe)
router.post('/fetch-url', auth, validate(schemas.fetchUrl), ctrl.fetchUrl);

// GET /api/jobs/similar — búsqueda multi-provider (params en query)
router.get('/similar', auth, ctrl.similar);

// POST /api/jobs/compatibility — score CV vs vacante (con cache)
router.post('/compatibility', auth, validate(schemas.compatibility), ctrl.compatibility);

module.exports = router;
