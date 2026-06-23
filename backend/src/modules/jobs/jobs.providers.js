// jobs.providers — integraciones de búsqueda de vacantes externas.
// Cada provider degrada con gracia (devuelve [] si falta su API key o falla).
// No tocan PII del usuario.

// Mapea texto de ubicación a country code (gl).
function detectarGL(location) {
  if (!location) return 'mx';
  const loc = location.toLowerCase();
  const map = [
    [['méxico', 'mexico', 'cdmx', 'ciudad de méxico', 'monterrey', 'guadalajara', 'puebla', 'querétaro'], 'mx'],
    [['colombia', 'bogotá', 'bogota', 'medellín', 'medellin', 'cali', 'barranquilla'], 'co'],
    [['argentina', 'buenos aires', 'córdoba', 'rosario'], 'ar'],
    [['chile', 'santiago', 'valparaíso'], 'cl'],
    [['perú', 'peru', 'lima', 'arequipa'], 'pe'],
    [['españa', 'spain', 'madrid', 'barcelona', 'valencia'], 'es'],
    [['ecuador', 'quito', 'guayaquil'], 'ec'],
    [['panamá', 'panama'], 'pa'],
    [['costa rica', 'san josé'], 'cr'],
    [['uruguay', 'montevideo'], 'uy'],
    [['united states', 'usa', 'new york', 'california', 'texas', 'florida'], 'us'],
    [['brasil', 'brazil', 'são paulo', 'rio de janeiro'], 'br'],
  ];
  for (const [keywords, gl] of map) {
    if (keywords.some(k => loc.includes(k))) return gl;
  }
  return 'mx';
}

// Detecta resultados claramente de USA (para post-filtro en búsquedas LATAM).
const ES_USA_REGEX = /\b(united states|u\.s\.a?|usa|u\.s\b|new york|new jersey|california|texas|florida|illinois|georgia|washington,?\s*d\.?\s*c\.?|ohio|pennsylvania|north carolina|michigan|virginia|arizona|tennessee|massachusetts|chicago|los angeles|san francisco|houston|dallas|austin|seattle|boston|denver|atlanta|phoenix|san diego|miami)\b/i;
const esResultadoUSA = (v) => ES_USA_REGEX.test(v.location || '');

async function searchJooble({ title, location, datecreated, employment_type, experience, radius, salary, page }) {
  const apiKey = process.env.JOOBLE_API_KEY;
  if (!apiKey) return [];
  try {
    const body = { keywords: title, location: location || '', resultsOnPage: 15, page: parseInt(page) || 1 };
    if (datecreated) body.datecreated = datecreated;
    if (employment_type) body.employment_type = employment_type;
    if (experience) body.experience = experience;
    if (radius) body.radius = parseInt(radius);
    if (salary) body.salary = parseInt(salary);
    const res = await fetch(`https://jooble.org/api/${apiKey}`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body),
    });
    if (!res.ok) return [];
    const data = await res.json();
    return (data.jobs || []).map(j => ({
      id: `jooble-${j.id}`, title: j.title, company: j.company, location: j.location,
      salary: j.salary || null, snippet: j.snippet, link: j.link, updated: j.updated, fuente: 'Jooble',
    }));
  } catch { return []; }
}

async function searchGoogleJobs({ title, location, datecreated }) {
  const apiKey = process.env.SERPAPI_KEY;
  if (!apiKey) return [];
  try {
    const gl = detectarGL(location);
    const queryConUbicacion = location ? `${title} ${location}` : title;
    const params = new URLSearchParams({ engine: 'google_jobs', q: queryConUbicacion, location: location || '', hl: 'es', gl, api_key: apiKey });
    if (datecreated) {
      const chipMap = { '1': 'date_posted:today', '3': 'date_posted:3days', '7': 'date_posted:week', '30': 'date_posted:month' };
      if (chipMap[datecreated]) params.set('chips', chipMap[datecreated]);
    }
    const res = await fetch(`https://serpapi.com/search.json?${params}`);
    if (!res.ok) return [];
    const data = await res.json();
    return (data.jobs_results || []).map((j, i) => ({
      id: `serp-${i}-${j.title}`, title: j.title, company: j.company_name, location: j.location,
      salary: j.detected_extensions?.salary_range || null, snippet: j.description?.slice(0, 300) || '',
      link: j.apply_options?.[0]?.link || j.related_links?.[0]?.link || j.share_link || '',
      via: j.apply_options?.[0]?.title || null, updated: j.detected_extensions?.posted_at || null, fuente: 'Google Jobs',
    }));
  } catch { return []; }
}

const ADZUNA_COUNTRY_MAP = { mx: 'mx', co: 'co', ar: 'ar', cl: 'cl', pe: 'pe', es: 'es', br: 'br', us: 'us' };
async function searchAdzuna({ title, location, datecreated, employment_type }) {
  const appId = process.env.ADZUNA_APP_ID, appKey = process.env.ADZUNA_APP_KEY;
  if (!appId || !appKey) return [];
  try {
    const country = ADZUNA_COUNTRY_MAP[detectarGL(location)] || 'mx';
    const params = new URLSearchParams({ app_id: appId, app_key: appKey, results_per_page: '15', what: title, where: location || '', content_type: 'application/json' });
    if (employment_type) params.set('full_time', employment_type === 'Full-time' ? '1' : '0');
    if (datecreated && ['1', '3', '7', '30'].includes(datecreated)) params.set('max_days_old', datecreated);
    const res = await fetch(`https://api.adzuna.com/v1/api/jobs/${country}/search/1?${params}`);
    if (!res.ok) return [];
    const data = await res.json();
    return (data.results || []).map((j, i) => ({
      id: `adzuna-${j.id || i}`, title: j.title, company: j.company?.display_name || '', location: j.location?.display_name || '',
      salary: j.salary_min ? `${Math.round(j.salary_min).toLocaleString()} - ${Math.round(j.salary_max || j.salary_min).toLocaleString()}` : null,
      snippet: (j.description || '').slice(0, 300), link: j.redirect_url || '', updated: j.created || null, fuente: 'Adzuna',
    }));
  } catch { return []; }
}

async function searchJSearch({ title, location, employment_type }) {
  const apiKey = process.env.JSEARCH_API_KEY;
  if (!apiKey) return [];
  try {
    const query = location ? `${title} in ${location}` : title;
    const params = new URLSearchParams({ query, page: '1', num_pages: '1' });
    if (employment_type) {
      const typeMap = { 'Full-time': 'FULLTIME', 'Part-time': 'PARTTIME', 'Contract': 'CONTRACTOR', 'Internship': 'INTERN' };
      if (typeMap[employment_type]) params.set('employment_types', typeMap[employment_type]);
    }
    const res = await fetch(`https://jsearch.p.rapidapi.com/search?${params}`, {
      headers: { 'X-RapidAPI-Key': apiKey, 'X-RapidAPI-Host': 'jsearch.p.rapidapi.com' },
    });
    if (!res.ok) return [];
    const data = await res.json();
    return (data.data || []).map((j, i) => ({
      id: `jsearch-${j.job_id || i}`, title: j.job_title, company: j.employer_name || '',
      location: [j.job_city, j.job_state, j.job_country].filter(Boolean).join(', '),
      salary: j.job_min_salary ? `${j.job_min_salary.toLocaleString()} - ${(j.job_max_salary || j.job_min_salary).toLocaleString()} ${j.job_salary_currency || ''}`.trim() : null,
      snippet: (j.job_description || '').slice(0, 300), link: j.job_apply_link || j.job_google_link || '',
      updated: j.job_posted_at_datetime_utc || null, fuente: 'LinkedIn',
    }));
  } catch { return []; }
}

async function searchRemotive({ title }) {
  try {
    const params = new URLSearchParams({ search: title, limit: '10' });
    const res = await fetch(`https://remotive.com/api/remote-jobs?${params}`);
    if (!res.ok) return [];
    const data = await res.json();
    return (data.jobs || []).map(j => ({
      id: `remotive-${j.id}`, title: j.title, company: j.company_name || '', location: j.candidate_required_location || 'Remoto',
      salary: j.salary || null, snippet: (j.description || '').replace(/<[^>]*>/g, '').slice(0, 300),
      link: j.url || '', updated: j.publication_date || null, fuente: 'Remotive',
    }));
  } catch { return []; }
}

module.exports = {
  detectarGL, esResultadoUSA,
  searchJooble, searchGoogleJobs, searchAdzuna, searchJSearch, searchRemotive,
};
