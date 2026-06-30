// Parsers de respuestas con delimitadores XML. Más robustos que JSON para textos largos.
// Portado verbatim desde deepseekService (camino vivo): incluye weakBullets en optimize y
// el parseo robusto de keywords (con/sin corchetes) + dimensiones en match.

const parsearRespuestaOptimize = (text) => {
  const cvMatch = text.match(/<CV>([\s\S]*?)<\/CV>/);
  const cambiosMatch = text.match(/<CAMBIOS>([\s\S]*?)<\/CAMBIOS>/);
  const recMatch = text.match(/<RECOMENDACIONES>([\s\S]*?)<\/RECOMENDACIONES>/);
  const bulletsMatch = text.match(/<BULLETS>([\s\S]*?)<\/BULLETS>/);

  let weakBullets = [];
  if (bulletsMatch) {
    const blocks = bulletsMatch[1].trim().split(/\n{2,}/).filter(Boolean);
    weakBullets = blocks.map(block => {
      const antes    = (block.match(/^ANTES:\s*(.+)/m)    || [])[1]?.trim() || '';
      const despues  = (block.match(/^DESPU[EÉ]S:\s*(.+)/m) || [])[1]?.trim() || '';
      const problema = (block.match(/^PROBLEMA:\s*(.+)/m)  || [])[1]?.trim() || '';
      return { antes, despues, problema };
    }).filter(b => b.antes && b.despues);
  }

  return {
    optimizedCV: cvMatch ? cvMatch[1].trim() : text.trim(),
    changes: cambiosMatch ? cambiosMatch[1].trim().split('\n').map(l => l.replace(/^[-•]\s*/, '').trim()).filter(Boolean) : [],
    recommendations: recMatch ? recMatch[1].trim().split('\n').map(l => l.replace(/^[-•]\s*/, '').trim()).filter(Boolean) : [],
    weakBullets,
  };
};

const parsearRespuestaMatch = (text) => {
  const cvMatch = text.match(/<CV>([\s\S]*?)<\/CV>/);
  const scoreMatch = text.match(/<SCORE>([\s\S]*?)<\/SCORE>/);
  const analisisMatch = text.match(/<ANALISIS>([\s\S]*?)<\/ANALISIS>/);
  const cambiosMatch = text.match(/<CAMBIOS>([\s\S]*?)<\/CAMBIOS>/);
  const jobMatch = text.match(/<VACANTE>([\s\S]*?)<\/VACANTE>/);
  const kwMatch = text.match(/<KEYWORDS>([\s\S]*?)<\/KEYWORDS>/);
  const dimMatch = text.match(/<DIMENSIONES>([\s\S]*?)<\/DIMENSIONES>/);

  let analisis = null;
  if (analisisMatch) {
    const raw = analisisMatch[1].trim();
    const fortalezasMatch = raw.match(/FORTALEZAS:\s*([\s\S]*?)(?=BRECHAS:|$)/i);
    const brechasMatch = raw.match(/BRECHAS:\s*([\s\S]*?)(?=CONCLUSION:|$)/i);
    const conclusionMatch = raw.match(/CONCLUSION:\s*([\s\S]*?)$/i);
    analisis = {
      fortalezas: fortalezasMatch ? fortalezasMatch[1].trim().split('\n').map(l => l.replace(/^[-•]\s*/, '').trim()).filter(Boolean) : [],
      brechas: brechasMatch ? brechasMatch[1].trim().split('\n').map(l => l.replace(/^[-•]\s*/, '').trim()).filter(Boolean) : [],
      conclusion: conclusionMatch ? conclusionMatch[1].trim() : '',
    };
  }

  let jobData = { title: '', location: '', country: '' };
  if (jobMatch) {
    const jobText = jobMatch[1].trim();
    const titleMatch = jobText.match(/titulo:\s*(.+)/i);
    const locationMatch = jobText.match(/ubicacion:\s*(.+)/i);
    const countryMatch = jobText.match(/pais:\s*(.+)/i);
    jobData = {
      title: titleMatch ? titleMatch[1].trim() : '',
      location: locationMatch ? locationMatch[1].trim() : '',
      country: countryMatch ? countryMatch[1].trim() : '',
    };
  }

  let keywords = null;
  if (kwMatch) {
    const raw = kwMatch[1].trim();
    // Regex robusto: acepta tanto [kw1, kw2] como kw1, kw2 (sin corchetes)
    const parseKwList = (label) => {
      const withBrackets = raw.match(new RegExp(`${label}:\\s*\\[([^\\]]*)\\]`, 'i'));
      if (withBrackets) {
        return withBrackets[1].split(',').map(s => s.trim().replace(/^["'\[\]]+|["'\[\]]+$/g, '')).filter(Boolean);
      }
      const withoutBrackets = raw.match(new RegExp(`${label}:\\s*([^\\n]+)`, 'i'));
      if (withoutBrackets) {
        return withoutBrackets[1].split(',').map(s => s.trim().replace(/^["'\[\]]+|["'\[\]]+$/g, '')).filter(Boolean);
      }
      return [];
    };
    keywords = {
      criticas: {
        presentes: parseKwList('CRITICAS_PRESENTES'),
        ausentes:  parseKwList('CRITICAS_AUSENTES'),
      },
      complementarias: {
        presentes: parseKwList('COMPLEMENTARIAS_PRESENTES'),
        ausentes:  parseKwList('COMPLEMENTARIAS_AUSENTES'),
      },
    };
    const total = keywords.criticas.presentes.length + keywords.criticas.ausentes.length +
                  keywords.complementarias.presentes.length + keywords.complementarias.ausentes.length;
    if (total === 0) keywords = null;
  }

  let dimensiones = null;
  if (dimMatch) {
    const raw = dimMatch[1];
    const parseDim = (key) => {
      const m = raw.match(new RegExp(`${key}:\\s*(\\d+)`, 'i'));
      return m ? Math.min(100, Math.max(0, parseInt(m[1], 10))) : null;
    };
    dimensiones = {
      hard_skills: parseDim('hard_skills'),
      soft_skills: parseDim('soft_skills'),
      experiencia: parseDim('experiencia'),
      formato_ats: parseDim('formato_ats'),
    };
  }

  return {
    tailoredCV: cvMatch ? cvMatch[1].trim() : text.trim(),
    matchScore: scoreMatch ? parseInt(scoreMatch[1].trim(), 10) || 0 : 0,
    analisis,
    changes: cambiosMatch ? cambiosMatch[1].trim().split('\n').map(l => l.replace(/^[-•]\s*/, '').trim()).filter(Boolean) : [],
    jobData,
    keywords,
    dimensiones,
  };
};

module.exports = { parsearRespuestaOptimize, parsearRespuestaMatch };
