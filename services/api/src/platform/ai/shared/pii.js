// Anti-alucinación de PII de contacto + bloque de datos verificados.
// Portado verbatim desde deepseekService (camino vivo). NO inventamos PII jamás:
// si el modelo devuelve un email/URL que no estaba en el input ni en el perfil verificado, se elimina.

const _emailRegex = /[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/gi;
const _urlRegex = /(https?:\/\/[^\s|<>"']+|(?:linkedin\.com|github\.com|behance\.net|dribbble\.com|medium\.com|notion\.so)\/[^\s|<>"']+)/gi;
const _phoneRegex = /[+]?[\d][\d\s\-().]{6,}\d/g;

const extraerEmails = (text) => { if (!text) return new Set(); return new Set((text.match(_emailRegex) || []).map(s => s.toLowerCase().trim())); };
const extraerUrls = (text) => { if (!text) return new Set(); return new Set((text.match(_urlRegex) || []).map(s => s.toLowerCase().trim().replace(/[.,;]$/, ''))); };
const extraerTelefonos = (text) => { if (!text) return new Set(); return new Set((text.match(_phoneRegex) || []).map(s => s.replace(/\D/g, '')).filter(s => s.length >= 7)); };

const sanitizarContactoAlucinado = (cvOptimizado, cvOriginal, perfilVerificado = {}) => {
  if (!cvOptimizado) return { cv: cvOptimizado, hallucinated: [] };
  const emailsPermitidos = extraerEmails(cvOriginal);
  if (perfilVerificado.email) emailsPermitidos.add(perfilVerificado.email.toLowerCase().trim());
  const urlsPermitidas = extraerUrls(cvOriginal);
  if (perfilVerificado.linkedin_url) urlsPermitidas.add(perfilVerificado.linkedin_url.toLowerCase().trim());
  const telefonosPermitidos = extraerTelefonos(cvOriginal);
  if (perfilVerificado.telefono1) { const t = String(perfilVerificado.telefono1).replace(/\D/g, ''); if (t.length >= 7) telefonosPermitidos.add(t); }
  if (perfilVerificado.indicativo1 && perfilVerificado.telefono1) { const t = (String(perfilVerificado.indicativo1) + String(perfilVerificado.telefono1)).replace(/\D/g, ''); if (t.length >= 7) telefonosPermitidos.add(t); }

  const hallucinated = [];
  let cv = cvOptimizado;
  const emailsEnOutput = cvOptimizado.match(_emailRegex) || [];
  for (const email of emailsEnOutput) {
    if (!emailsPermitidos.has(email.toLowerCase().trim())) {
      hallucinated.push(`email:${email}`);
      cv = cv.replace(new RegExp(`\\s*\\|\\s*${email.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}|${email.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\s*\\|?\\s*`, 'gi'), '');
    }
  }
  const urlsEnOutput = cvOptimizado.match(_urlRegex) || [];
  for (const url of urlsEnOutput) {
    const norm = url.toLowerCase().trim().replace(/[.,;]$/, '');
    let permitida = false;
    for (const ok of urlsPermitidas) { if (norm.includes(ok.replace(/^https?:\/\//, '')) || ok.includes(norm.replace(/^https?:\/\//, ''))) { permitida = true; break; } }
    if (!permitida) {
      hallucinated.push(`url:${url}`);
      cv = cv.replace(new RegExp(`\\s*\\|\\s*${url.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}|${url.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\s*\\|?\\s*`, 'gi'), '');
    }
  }
  cv = cv.replace(/\s*\|\s*\|\s*/g, ' | ').replace(/^\s*\|\s*/gm, '').replace(/\s*\|\s*$/gm, '');
  return { cv: cv.trim(), hallucinated };
};

const construirBloqueVerificado = (perfilVerificado = {}) => {
  const p = perfilVerificado;
  const lineas = [];
  if (p.nombre1 || p.apellido1) lineas.push(`- Nombre completo: ${[p.nombre1, p.apellido1].filter(Boolean).join(' ')}`);
  if (p.email) lineas.push(`- Email: ${p.email}`);
  if (p.telefono1) lineas.push(`- Teléfono: ${p.indicativo1 || ''} ${p.telefono1}`.trim());
  if (p.pais) lineas.push(`- País: ${p.pais}`);
  if (p.ciudad) lineas.push(`- Ciudad: ${p.ciudad}`);
  if (p.linkedin_url) lineas.push(`- LinkedIn: ${p.linkedin_url}`);
  if (lineas.length === 0) return '';
  return `\n═══════════════════════════════════════════════════════════════════\nDATOS DE CONTACTO VERIFICADOS DEL USUARIO:\n${lineas.join('\n')}\n\nREGLA: usa estos datos TEXTUALMENTE si aparecen en el CV. NO uses ningún dato que no esté aquí ni en el CV original. Si falta, OMÍTELO.\n═══════════════════════════════════════════════════════════════════\n`;
};

module.exports = { sanitizarContactoAlucinado, construirBloqueVerificado };
