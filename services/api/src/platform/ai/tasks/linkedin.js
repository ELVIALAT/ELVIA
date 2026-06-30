// Tasks de LinkedIn. Prompts/parsing portados verbatim desde deepseekService (camino vivo).
// extraerDatosLinkedin parsea texto de perfil (puede traer contacto) → PII-lock a Claude Haiku.
// analizarLinkedin es análisis estratégico sin extracción de contacto → Sonnet objetivo (DeepSeek en aterrizaje).
const { complete } = require('../complete');
const { TASKS } = require('../policy');
const { stripCodeFence } = require('../shared/sistema');

// ── Extrae secciones estructuradas de un texto "sucio" de LinkedIn (EXTRACCIÓN, PII-lock) ─
async function extraerDatosLinkedin(rawText, ctx = {}) {
  const fragmento = rawText.substring(0, 10000);

  const prompt = `Analiza el siguiente texto extraído de un perfil de LinkedIn (puede ser de un PDF o de un copiado-pegado de la web) y extrae las secciones principales de forma estructurada.
Responde ÚNICAMENTE con JSON válido, sin texto adicional ni markdown.

TEXTO DEL PERFIL:
${fragmento}

Devuelve exactamente esta estructura:
{
  "titular": "Frase debajo del nombre",
  "extracto": "Sección 'Acerca de' completa",
  "experiencia": "Lista detallada de cargos, empresas, fechas y logros",
  "habilidades": "Lista de aptitudes profesionales separadas por coma (NO incluir idiomas aquí)",
  "idiomas": "Idiomas y niveles (ej: Español (Nativo), Inglés (B2 – Avanzado))",
  "educacion": "Instituciones y títulos obtenidos"
}

REGLAS:
- Si una sección no se encuentra o está vacía, usa string vacío "".
- Limpia ruidos del PDF (como 'Página 1 de 2', 'LinkedIn', etc.) pero mantén el contenido profesional intacto.
- En 'experiencia', trata de mantener el formato descriptivo original.
- Para 'idiomas': busca sección titulada 'Idiomas', 'Languages', 'Lenguajes', 'Idioma' o equivalente. Si no existe como sección separada pero aparecen menciones de idiomas en el texto (Inglés/English, Español/Spanish, Francés/French, Portugués/Portuguese, Alemán/German, etc.), extráelos aquí con sus niveles si los hay. NUNCA pongas idiomas en 'habilidades'.`;

  const text = await complete({
    task: TASKS.LINKEDIN_EXTRAER,
    messages: [{ role: 'user', content: prompt }],
    maxTokens: 2500,
    tenant: ctx.tenant,
  });

  const jsonText = stripCodeFence(text);
  try {
    const rawData = JSON.parse(jsonText);
    const formatEntry = (entry) => {
      if (typeof entry === 'string') return entry;
      if (typeof entry === 'object' && entry !== null) {
        return Object.entries(entry).map(([k, v]) => `${k.charAt(0).toUpperCase() + k.slice(1)}: ${v}`).join(' | ');
      }
      return String(entry);
    };
    return {
      titular:    typeof rawData.titular    === 'string' ? rawData.titular    : formatEntry(rawData.titular    || ''),
      extracto:   typeof rawData.extracto   === 'string' ? rawData.extracto   : formatEntry(rawData.extracto   || ''),
      experiencia: Array.isArray(rawData.experiencia) ? rawData.experiencia.map(formatEntry).join('\n\n') : formatEntry(rawData.experiencia || ''),
      habilidades: Array.isArray(rawData.habilidades) ? rawData.habilidades.join(', ') : String(rawData.habilidades || ''),
      idiomas:    typeof rawData.idiomas    === 'string' ? rawData.idiomas    : (Array.isArray(rawData.idiomas) ? rawData.idiomas.join(', ') : ''),
      educacion:  Array.isArray(rawData.educacion) ? rawData.educacion.map(formatEntry).join('\n\n') : formatEntry(rawData.educacion || ''),
    };
  } catch (error) {
    console.error('[linkedin.extraer] Error al parsear JSON:', error.message);
    throw new Error('La IA no pudo estructurar los datos correctamente. Intenta con el pegado manual.');
  }
}

// ── Analiza el perfil LinkedIn y devuelve puntajes + sugerencias (PREMIUM no-PII) ─
async function analizarLinkedin({
  titular,
  extracto,
  experiencia,
  habilidades,
  idiomas,
  educacion,
  contextoLaboral,
  gerenteContext, // { oferta_valor, hard_skills[], soft_skills[] }
  cvOptimo,       // { titular, extracto } — del CV optimizado más reciente del usuario
}, ctx = {}) {
  const secciones = [];
  if (titular?.trim())    secciones.push(`TITULAR:\n${titular}`);
  if (extracto?.trim())   secciones.push(`EXTRACTO:\n${extracto}`);
  if (experiencia?.trim()) secciones.push(`EXPERIENCIA:\n${experiencia}`);
  if (habilidades?.trim()) secciones.push(`HABILIDADES (Aptitudes):\n${habilidades}`);
  if (idiomas?.trim())    secciones.push(`IDIOMAS:\n${idiomas}`);
  if (educacion?.trim())  secciones.push(`EDUCACION:\n${educacion}`);

  const gerenteBlock = (() => {
    if (!gerenteContext) return '';
    const lineas = [];
    if (gerenteContext.oferta_valor) {
      lineas.push(`- Oferta de Valor declarada: "${String(gerenteContext.oferta_valor).slice(0, 1500)}"`);
    }
    if (Array.isArray(gerenteContext.hard_skills) && gerenteContext.hard_skills.length > 0) {
      lineas.push(`- Hard Skills declaradas: ${gerenteContext.hard_skills.join(', ')}`);
    }
    if (Array.isArray(gerenteContext.soft_skills) && gerenteContext.soft_skills.length > 0) {
      lineas.push(`- Power Skills declaradas: ${gerenteContext.soft_skills.join(', ')}`);
    }
    if (lineas.length === 0) return '';
    return `\nDATOS DECLARADOS POR EL USUARIO (Gerente de Proyecto):\n${lineas.join('\n')}\n`;
  })();

  const cvBlock = (() => {
    if (!cvOptimo) return '';
    const lineas = [];
    if (cvOptimo.titular)  lineas.push(`- Titular CV optimizado: "${String(cvOptimo.titular).slice(0, 300)}"`);
    if (cvOptimo.extracto) lineas.push(`- Resumen CV optimizado: "${String(cvOptimo.extracto).slice(0, 1200)}"`);
    if (lineas.length === 0) return '';
    return `\nCV OPTIMIZADO EXISTENTE DEL USUARIO (úsalo como base de verdad para mantener coherencia con su narrativa):\n${lineas.join('\n')}\n`;
  })();

  const prompt = `Eres un experto en personal branding y LinkedIn para el mercado laboral de LATAM 2026.
Analiza las siguientes secciones del perfil LinkedIn de un profesional y devuelve un análisis detallado.

PERFIL A ANALIZAR:
${secciones.join('\n\n')}

${contextoLaboral ? `CONTEXTO DEL PROYECTO LABORAL DEL USUARIO:
${JSON.stringify({
  objetivo: contextoLaboral.objetivoLaboral,
  industrias: contextoLaboral.sectoresInteres,
  ciudades: contextoLaboral.ciudadesDestino,
  esquemas: contextoLaboral.esquemasTrabajo,
  empresasTarget: contextoLaboral.empresasMock
}, null, 2)}
` : ''}
${gerenteBlock}${cvBlock}

CRITERIOS DE EVALUACIÓN 2026:
- Alineación Estratégica: Si hay CONTEXTO DEL PROYECTO LABORAL, todas las sugerencias deben orientarse a posicionar al profesional para ese objetivo, industria y ciudades específicas.
- Titular: debe contener cargo (alineado al objetivo si hay), industria/nicho, propuesta de valor, keywords de ATS. Máx 220 chars.
- Extracto: primera línea con gancho, historia profesional acorde al objetivo, logros cuantificados, CTA. Debe tener 3+ párrafos.
- Experiencia: verbos de acción, logros con métricas, descripciones enfocadas en habilidades transferibles al rol objetivo.
- Habilidades (Aptitudes/Skills): CRITERIO DE PUNTAJE ESPECIAL — el PDF exportado por LinkedIn solo muestra las 3 habilidades destacadas por diseño de la plataforma, esto NO refleja cuántas tiene el usuario en su perfil real. Por tanto: puntaje 0 = perfil sin ninguna habilidad declarada; puntaje 60-100 = tiene cualquier cantidad de habilidades (incluso 3). NUNCA bajes el puntaje por tener pocas habilidades visibles en el PDF. El diagnóstico debe destacar que lo importante es tener habilidades (cualquier cantidad), ordenadas por relevancia para su sector objetivo. Sugiere cuáles agregar o reordenar. NUNCA incluir idiomas aquí.
- Idiomas: evalúa si el nivel declarado es creíble y suficiente para el objetivo laboral. La sección Idiomas en LinkedIn es DIFERENTE de Aptitudes/Habilidades.

REGLAS ESTRICTAS DE ÉTICA Y CALIDAD:
1. NO inventes ni asumas experiencia laboral, títulos o habilidades que no estén explícitamente en el perfil.
2. Centra tu análisis en el mérito profesional. Prohibido mencionar edad, género, raza u origen.
3. El campo "ejemplo" debe proveer una redacción lista para usar que respete el estilo y la verdad del candidato.
4. RESPETA badges de autoridad del usuario (TOP VOICE, Certificaciones LinkedIn, In Demand, Premios) — NO los elimines del titular ni del extracto; son señales de marca personal. Optimiza el resto del texto alrededor.
5. Si existen DATOS DECLARADOS POR EL USUARIO (Oferta de Valor / Hard / Power Skills), úsalos como ancla de verdad para reforzar el posicionamiento. NO los inventes ni los contradigas.
6. Si existe CV OPTIMIZADO, mantén coherencia narrativa con su titular y resumen — el LinkedIn debe alinearse con la historia que ya construyó.

Responde ÚNICAMENTE con un JSON con esta estructura exacta (sin texto extra):
{
  "puntaje_global": <número 0-100>,
  "resumen_global": "<2-3 oraciones evaluando el perfil frente a sus objetivos>",
  "top_acciones": ["<acción prioritaria 1>", "<acción prioritaria 2>", "<acción prioritaria 3>"],
  "secciones": {
    "titular": {
      "puntaje": <0-100 o null si no fue enviada>,
      "diagnostico": "<1-2 oraciones de diagnóstico>",
      "fortalezas": ["<punto fuerte>"],
      "mejoras": ["<qué mejorar>"],
      "ejemplo": "<reescritura sugerida optimizada>"
    },
    "extracto": { "puntaje": <0-100 o null>, "diagnostico": "...", "fortalezas": [], "mejoras": [], "ejemplo": "..." },
    "experiencia": { "puntaje": <0-100 o null>, "diagnostico": "...", "fortalezas": [], "mejoras": [], "ejemplo": "..." },
    "habilidades": { "puntaje": <0-100 o null>, "diagnostico": "...", "fortalezas": [], "mejoras": [], "ejemplo": "..." },
    "idiomas": { "puntaje": <0-100 o null>, "diagnostico": "...", "fortalezas": [], "mejoras": [], "ejemplo": "..." },
    "educacion": { "puntaje": <0-100 o null>, "diagnostico": "...", "fortalezas": [], "mejoras": [], "ejemplo": "..." }
  },
  "sugerencias_aplicables": {
    "titular": "<texto final listo para pegar en LinkedIn, max 220 chars>",
    "extracto": "<texto final listo para pegar, max 2600 chars, 3+ párrafos>",
    "experiencia": "<texto final listo para pegar en la sección Experiencia>",
    "habilidades": ["<skill 1>", "<skill 2>", "<skill 3>", "..."],
    "idiomas": "<texto final listo para pegar en la sección Idiomas, ej: Español (Nativo), Inglés (B2 – Avanzado)>",
    "educacion": "<texto final listo para pegar en la sección Educación>"
  }
}

Para secciones no enviadas, devuelve null en "puntaje" y strings vacíos en los demás campos.
En "sugerencias_aplicables", devuelve strings vacíos para secciones no enviadas (excepto "habilidades" que es array vacío []).
El array "habilidades" debe contener máximo 50 skills, priorizando la intersección de: (a) las Hard/Power Skills declaradas por el usuario, (b) skills demandadas en LinkedIn 2026 para su industria/cargo objetivo, (c) experiencias reales del perfil.`;

  const text = await complete({
    task: TASKS.LINKEDIN_ANALIZAR,
    messages: [{ role: 'user', content: prompt }],
    maxTokens: 4000,
    tenant: ctx.tenant,
  });

  const jsonText = stripCodeFence(text);
  const jsonMatch = jsonText.match(/\{[\s\S]*\}/);
  if (!jsonMatch) throw new Error('No se pudo parsear el análisis de LinkedIn');
  return JSON.parse(jsonMatch[0]);
}

module.exports = { extraerDatosLinkedin, analizarLinkedin };
