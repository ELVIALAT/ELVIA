// jobs.ssrf — whitelist de dominios de empleo + validación anti-SSRF.
// Aislado por ser lógica de seguridad (SSRF Guard del CLAUDE.md).

const ALLOWED_JOB_DOMAINS = [
  'linkedin.com', 'indeed.com', 'glassdoor.com', 'computrabajo.com',
  'occ.com.mx', 'bumeran.com', 'elempleo.com', 'trabajando.com',
  'infojobs.net', 'zonajobs.com.ar', 'laborum.com', 'multitrabajos.com',
  'hh.ru', 'monster.com', 'simplyhired.com', 'ziprecruiter.com',
  'angel.co', 'wellfound.com', 'greenhouse.io', 'lever.co',
  'workday.com', 'smartrecruiters.com', 'jobs.ashbyhq.com',
];

function isAllowedJobUrl(rawUrl) {
  try {
    const parsed = new URL(rawUrl);
    if (parsed.protocol !== 'https:' && parsed.protocol !== 'http:') return false;
    const hostname = parsed.hostname.replace(/^www\./, '');
    return ALLOWED_JOB_DOMAINS.some(d => hostname === d || hostname.endsWith(`.${d}`));
  } catch {
    return false;
  }
}

module.exports = { ALLOWED_JOB_DOMAINS, isAllowedJobUrl };
