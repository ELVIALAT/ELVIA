// platform/email — punto de entrada del módulo de email.
// Agrupa los envíos por dominio (transactional/waitlist/tenancy/nurture) sobre un cliente Resend compartido.
const transactional = require('./transactional');
const waitlist = require('./waitlist');
const tenancy = require('./tenancy');
const nurture = require('./nurture');

module.exports = { ...transactional, ...waitlist, ...tenancy, ...nurture };
