// notifications.routes — solo wiring: path → middleware → controller.
// Sin lógica. El patrón modular: routes → controller → service → repository.
const express = require('express');
const router = express.Router();
const auth = require('../../middleware/auth');
const { validate } = require('../../middleware/validate');
const { sendCv } = require('./notifications.schemas');
const { postSendCv } = require('./notifications.controller');

// POST /api/notifications/send-cv — envía el CV del usuario por email
router.post('/send-cv', auth, validate(sendCv), postSendCv);

module.exports = router;
