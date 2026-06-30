// Barrel de todas las tasks de IA, agrupadas por dominio (espejo de modules/).
const cv = require('./cv');
const interview = require('./interview');
const linkedin = require('./linkedin');
const mentor = require('./mentor');

module.exports = { ...cv, ...interview, ...linkedin, ...mentor };
