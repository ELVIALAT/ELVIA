// mentor.routes — wiring de los dos chats del mentor ELVIA.
// Exporta dos routers porque se montan en paths distintos en app.js:
//   chatRouter       → /api/chat
//   manualChatRouter → /api/chat/manual
const express = require('express');
const auth = require('../../middleware/auth');
const { validate } = require('../../middleware/validate');
const { dailyCap } = require('../../middleware/dailyCap');
const chatRateLimit = require('../../middleware/chatRateLimit');
const manualChatLimit = require('../../middleware/manualChatLimit');
const schemas = require('./mentor.schemas');
const ctrl = require('./mentor.controller');

// Chat general (copilot)
const chatRouter = express.Router();
chatRouter.post('/', auth, chatRateLimit, validate(schemas.chat), ctrl.chat);

// Chat modo manual (responde solo con el manual ELVIA)
const manualChatRouter = express.Router();
manualChatRouter.post('/', auth, dailyCap, manualChatLimit, validate(schemas.manualChat), ctrl.manualChat);

module.exports = { chatRouter, manualChatRouter };
