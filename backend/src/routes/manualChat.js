// backend/src/routes/manualChat.js
const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const { dailyCap } = require('../middleware/dailyCap');
const manualChatLimit = require('../middleware/manualChatLimit');
const { handleManualChat } = require('../controllers/manualChatController');

// POST /api/chat/manual — Bot ELVIA en Modo Manual (responde solo con el manual)
router.post('/', auth, dailyCap, manualChatLimit, handleManualChat);

module.exports = router;
