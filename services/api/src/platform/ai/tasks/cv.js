// Tasks de CV. Prompts y parsing portados verbatim desde deepseekService (camino vivo);
// el provider/modelo lo decide la política (cv.optimize/match/carta → Claude Sonnet por PII-lock).
const { complete } = require('../complete');
const { TASKS } = require('../policy');
const { SISTEMA_BASE, ETIQUETA_IDIOMA, stripCodeFence } = require('../shared/sistema');
const { construirBloqueVerificado, sanitizarContactoAlucinado } = require('../shared/pii');
const { parsearRespuestaOptimize, parsearRespuestaMatch } = require('../shared/parsers');

// ── Optimiza un CV al formato Harvard (PREMIUM, PII-lock) ────────────────────
async function optimizeCV(cvText, language = 'es', verifiedProfile = {}, ctx = {}) {
  const idioma = ETIQUETA_IDIOMA[language] || 'español';
  const bloqueVerificado = construirBloqueVerificado(verifiedProfile);

  const prompt = `Analiza el siguiente CV y optimízalo al formato Harvard.
IMPORTANTE: El CV, los cambios realizados y las recomendaciones deben estar TODOS en ${idioma}.
RECORDATORIO ABSOLUTO: NO inventes emails, teléfonos, URLs ni datos que no estén en el CV original
o en los datos verificados de abajo. Si un campo falta, OMÍTELO del encabezado — no uses placeholders.
${bloqueVerificado}
CV ORIGINAL:
${cvText}

Responde usando exactamente estos delimitadores (sin texto fuera de ellos):

<CV>
[CV completo optimizado en formato Harvard, en ${idioma}]
</CV>
<CAMBIOS>
- cambio realizado 1 (en ${idioma})
- cambio realizado 2 (en ${idioma})
</CAMBIOS>
<RECOMENDACIONES>
- recomendación adicional 1 (en ${idioma})
- recomendación adicional 2 (en ${idioma})
</RECOMENDACIONES>
<BULLETS>
ANTES: [bullet original más débil del CV]
DESPUÉS: [versión mejorada con verbo de acción y foco en resultado, en ${idioma}]
PROBLEMA: [1 oración: por qué era débil]

ANTES: [segundo bullet débil]
DESPUÉS: [versión mejorada, en ${idioma}]
PROBLEMA: [1 oración]

ANTES: [tercer bullet débil]
DESPUÉS: [versión mejorada, en ${idioma}]
PROBLEMA: [1 oración]
</BULLETS>`;

  const run = () => complete({
    task: TASKS.CV_OPTIMIZE,
    system: SISTEMA_BASE,
    cacheSystem: true,
    messages: [{ role: 'user', content: prompt }],
    maxTokens: 8000,
    temperature: 0.2,
    tenant: ctx.tenant,
  });

  let text = await run();
  if (!text || !/<CV>[\s\S]*<\/CV>/.test(text)) {
    console.warn('[cv.optimize] Respuesta sin delimitadores <CV>. Reintentando...');
    text = await run();
  }

  const parsed = parsearRespuestaOptimize(text);
  const { cv: cvSaneado, hallucinated } = sanitizarContactoAlucinado(parsed.optimizedCV, cvText, verifiedProfile);
  if (hallucinated.length > 0) {
    console.warn(`[cv.optimize] PII alucinada eliminada: ${hallucinated.join(', ')}`);
    parsed.optimizedCV = cvSaneado;
    parsed.recommendations = parsed.recommendations || [];
    parsed.recommendations.unshift('Algunos datos de contacto se omitieron porque no estaban en tu CV original. Agrégalos manualmente si quieres incluirlos.');
  }
  return parsed;
}

// ── Adapta un CV a una vacante + score de compatibilidad (PREMIUM, PII-lock) ─
async function matchCVtoJob(cvText, jobText, language = 'es', verifiedProfile = {}, contextoUbicacion = {}, ctx = {}) {
  const idioma = ETIQUETA_IDIOMA[language] || 'español';
  const bloqueVerificado = construirBloqueVerificado(verifiedProfile);

  // Bloque de ubicación — solo se incluye si hay datos; NO afecta el score
  let bloqueUbicacion = '';
  const { ciudadActual, paisActual, buscaReloc, ciudadesDestino = [] } = contextoUbicacion;
  if (ciudadActual || paisActual) {
    const ubicacionCandidato = [ciudadActual, paisActual].filter(Boolean).join(', ');
    const lineas = [
      `CONTEXTO DE UBICACIÓN (solo informativo — NO modifica el score):`,
      `- Ubicación actual del candidato: ${ubicacionCandidato}`,
    ];
    if (buscaReloc && ciudadesDestino.length > 0) {
      lineas.push(`- Abierto a relocalización: Sí — destinos declarados: ${ciudadesDestino.join(', ')}`);
      lineas.push(`- Si la vacante está en alguno de esos destinos, menciónalo positivamente en la CONCLUSION del ANALISIS.`);
    } else if (buscaReloc) {
      lineas.push(`- Abierto a relocalización: Sí (sin destinos específicos declarados).`);
      lineas.push(`- Si la vacante es en otra ciudad/país, mencionarlo como aspecto a confirmar con el candidato en la CONCLUSION del ANALISIS.`);
    } else {
      lineas.push(`- Relocalización: No declarada.`);
      lineas.push(`- Si la vacante está en una ciudad/país diferente a su ubicación actual, indícalo como aspecto a considerar en la CONCLUSION del ANALISIS, sin penalizar el score.`);
    }
    bloqueUbicacion = lineas.join('\n');
  }

  const prompt = `Analiza el CV y la vacante. Adapta el CV específicamente para esta vacante.
IMPORTANTE: El CV y los cambios realizados deben estar TODOS en ${idioma}.
RECORDATORIO ABSOLUTO: NO inventes emails, teléfonos, URLs ni habilidades/experiencias
que no estén en el CV original. Adaptar = reordenar y reformular lo existente.
${bloqueVerificado}
${bloqueUbicacion ? bloqueUbicacion + '\n' : ''}CV ORIGINAL:
${cvText}

DESCRIPCIÓN DE LA VACANTE:
${jobText}

CRITERIOS OBLIGATORIOS PARA CALCULAR EL SCORE:
- 90-100: Candidato cumple prácticamente TODOS los requisitos obligatorios y la mayoría de los deseables.
- 75-89: Cumple los requisitos core (experiencia, hard skills principales) con brechas menores en complementarios.
- 50-74: Cumple parcialmente. Faltan 2-3 requisitos importantes pero el perfil tiene potencial.
- 25-49: Brecha significativa. Faltan competencias centrales de la vacante.
- 0-24: El perfil no coincide con el rol. No se recomienda aplicar sin desarrollo previo.
CALIBRACIÓN: Un profesional de RRHH con 5 años aplicando a Gerente de RRHH que pide 8 años = 65%. El mismo aplicando a Coordinador de RRHH = 85%. Sé CONSISTENTE: el mismo CV + la misma vacante debe producir siempre el mismo score.

Responde usando exactamente estos delimitadores (sin texto fuera de ellos):

<CV>
[CV completo adaptado para esta vacante, en ${idioma}]
</CV>
<SCORE>
[número del 0 al 100 que representa el % de compatibilidad]
</SCORE>
<ANALISIS>
FORTALEZAS:
- [punto fuerte del candidato que coincide con la vacante]
BRECHAS:
- [habla directamente al candidato en segunda persona]
CONCLUSION:
[2-3 oraciones en segunda persona al candidato]
</ANALISIS>
<CAMBIOS>
- ajuste realizado 1 (en ${idioma})
</CAMBIOS>
<VACANTE>
titulo: [cargo detectado]
ubicacion: [ciudad o región]
pais: [país]
</VACANTE>
<KEYWORDS>
CRITICAS_PRESENTES: [keyword1, keyword2, keyword3]
CRITICAS_AUSENTES: [keyword4, keyword5, keyword6]
COMPLEMENTARIAS_PRESENTES: [keyword7, keyword8]
COMPLEMENTARIAS_AUSENTES: [keyword9, keyword10]
</KEYWORDS>

Instrucción KEYWORDS: Usa el formato exacto de arriba. CRITICAS son las habilidades, herramientas o requisitos que la vacante exige como obligatorios. COMPLEMENTARIAS son las deseables o de valor agregado. Indica en cada lista cuáles SÍ aparecen en el CV y cuáles NO. Mínimo 3 keywords por lista si existen en la vacante.
<DIMENSIONES>
hard_skills: [0-100]
soft_skills: [0-100]
experiencia: [0-100]
formato_ats: [0-100]
</DIMENSIONES>`;

  const run = () => complete({
    task: TASKS.CV_MATCH,
    system: SISTEMA_BASE,
    cacheSystem: true,
    messages: [{ role: 'user', content: prompt }],
    maxTokens: 8000,
    temperature: 0,
    tenant: ctx.tenant,
  });

  let text = await run();
  if (!text || !/<CV>[\s\S]*<\/CV>/.test(text)) {
    console.warn('[cv.match] Respuesta sin delimitadores <CV>. Reintentando...');
    text = await run();
  }

  const parsed = parsearRespuestaMatch(text);
  const { cv: cvSaneado, hallucinated } = sanitizarContactoAlucinado(parsed.tailoredCV, cvText, verifiedProfile);
  if (hallucinated.length > 0) {
    console.warn(`[cv.match] PII alucinada eliminada: ${hallucinated.join(', ')}`);
    parsed.tailoredCV = cvSaneado;
  }
  return parsed;
}

// ── Extrae datos estructurados del CV para la infografía (EXTRACCIÓN, PII-lock) ─
async function extraerDatosInfografia(cvText, ctx = {}) {
  const fragmento = cvText.substring(0, 6000);

  const prompt = `Analiza el siguiente CV y extrae los datos estructurados para generar una infografía visual profesional.
Responde ÚNICAMENTE con JSON válido, sin texto adicional ni markdown.

CV:
${fragmento}

Devuelve exactamente esta estructura:
{
  "nombre": "Nombre completo",
  "cargo": "Cargo o título profesional principal",
  "resumen": "Resumen profesional de 2-3 oraciones",
  "contacto": {
    "email": "email o null",
    "telefono": "teléfono o null",
    "ciudad": "Ciudad, País o null",
    "linkedin": "URL o usuario de LinkedIn o null"
  },
  "experiencia": [
    {
      "empresa": "Nombre empresa",
      "cargo": "Cargo",
      "periodo": "Ene 2021 – Actual",
      "bullets": ["logro 1 con verbo de acción", "logro 2"]
    }
  ],
  "educacion": [
    { "titulo": "MBA Marketing", "institucion": "Universidad X", "anio": "2021" }
  ],
  "habilidades": [
    { "nombre": "Nombre habilidad", "nivel": 90 }
  ],
  "idiomas": [
    { "idioma": "Español", "nivel": "Nativo", "puntos": 5 },
    { "idioma": "Inglés", "nivel": "C1", "puntos": 4 }
  ],
  "logros": [
    { "numero": "+43%", "descripcion": "Descripción breve del logro" }
  ],
  "diferenciadores": [
    "Frase corta que describe qué hace único a este candidato",
    "Otro diferenciador clave"
  ],
  "herramientas": ["Herramienta 1", "Herramienta 2"]
}

REGLAS:
- habilidades: máximo 6, con nivel del 0 al 100 estimado por el contexto del CV
- logros: máximo 3, extraer solo los que tengan números o métricas concretas
- diferenciadores: exactamente 3, frases cortas y específicas (no genéricas como "profesional comprometido")
- herramientas: máximo 8
- experiencia: máximo 3 entradas más recientes, máximo 3 bullets cada una
- Si no encuentras un dato, usa null o array vacío`;

  const text = await complete({
    task: TASKS.CV_INFOGRAFIA,
    messages: [{ role: 'user', content: prompt }],
    maxTokens: 1500,
    tenant: ctx.tenant,
  });
  return JSON.parse(stripCodeFence(text));
}

// ── Corrige/estructura el Proyecto Laboral (BULK, fallback al original) ──────
async function corregirProyectoLaboral(proyectoData, ctx = {}) {
  const prompt = `Actúa como un corrector de estilo corporativo experto en el mercado de América Latina.
Revisa el siguiente JSON que contiene la configuración del "Proyecto Laboral" de un profesional.
Tu tarea es corregir la ortografía, la gramática y mejorar sutilmente la redacción para que suene como un perfil ejecutivo de alto nivel, utilizando español hispanoamericano estándar (neutro, sin modismos locales).

No cambies la intención ni las variables, solo mejora los textos (por ej. 'objetivoLaboral', 'empresasMock', etc). Si hay arrays de strings, corrígelos también.

JSON ORIGINAL:
${JSON.stringify(proyectoData, null, 2)}

Devuelve ÚNICAMENTE el JSON estructurado con las mismas llaves, pero con el texto corregido. Valida que el JSON es 100% válido sintácticamente.`;

  let text;
  try {
    text = await complete({
      task: TASKS.CV_CORREGIR_PROYECTO,
      messages: [{ role: 'user', content: prompt }],
      maxTokens: 2000,
      tenant: ctx.tenant,
    });
  } catch (error) {
    console.error('[cv.corregirProyecto] Error:', error.message);
    return proyectoData; // fallback al original
  }

  try {
    return JSON.parse(stripCodeFence(text));
  } catch (error) {
    console.error('[cv.corregirProyecto] Error parse:', error.message);
    return proyectoData; // fallback al original
  }
}

// ── Genera carta de presentación (PREMIUM, PII-lock por cvText) ──────────────
async function generarCarta({ empresa, cargo, descripcion, cvText, language = 'es' }, ctx = {}) {
  const idioma = ETIQUETA_IDIOMA[language] || 'español';
  const cvSeccion = cvText ? `\nPERFIL DEL CANDIDATO (extraído de su CV):\n${cvText.slice(0, 3000)}` : '';

  const prompt = `Eres un experto en redacción de cartas de presentación para el mercado hispanoamericano.
Escribe una carta de presentación profesional, auténtica y persuasiva, en ${idioma}.

VACANTE:
Empresa: ${empresa || 'la empresa'}
Cargo: ${cargo || 'el puesto'}
Descripción: ${descripcion || 'no proporcionada'}
${cvSeccion}

INSTRUCCIONES:
- 3 párrafos: apertura impactante, cuerpo con 2-3 logros/competencias concretas alineadas a la vacante, cierre con llamada a la acción
- Tono profesional pero humano, sin clichés corporativos
- Si hay CV, usa datos reales del candidato; si no, usa [NOMBRE], [LOGRO] como placeholders
- Sin encabezado formal de carta (solo el cuerpo del texto)
- Máximo 250 palabras

Responde ÚNICAMENTE con el texto de la carta, sin explicaciones adicionales.`;

  const text = await complete({
    task: TASKS.CV_CARTA,
    messages: [{ role: 'user', content: prompt }],
    maxTokens: 800,
    temperature: 0.7,
    tenant: ctx.tenant,
  });
  return text.trim();
}

// ── Optimiza un resumen profesional (PREMIUM no-PII, fallback al original) ───
async function optimizarResumen(texto, idioma = 'es', contextoGerente = null, ctx = {}) {
  if (!texto || texto.trim().length < 10) return texto;

  const ctxBlock = (() => {
    if (!contextoGerente) return '';
    const c = contextoGerente;
    const lineas = [];
    if (c.oferta_valor) lineas.push(`- OFERTA DE VALOR: "${String(c.oferta_valor).slice(0, 1500)}"`);
    if (Array.isArray(c.hard_skills) && c.hard_skills.length > 0) lineas.push(`- COMPETENCIAS TÉCNICAS: ${c.hard_skills.join(', ')}`);
    if (Array.isArray(c.soft_skills) && c.soft_skills.length > 0) lineas.push(`- COMPETENCIAS DE IMPACTO: ${c.soft_skills.join(', ')}`);
    if (Array.isArray(c.niveles_cargo) && c.niveles_cargo.length > 0) lineas.push(`- NIVEL JERÁRQUICO objetivo: ${c.niveles_cargo.join(', ')}`);
    if (Array.isArray(c.areas) && c.areas.length > 0) lineas.push(`- ÁREAS de interés: ${c.areas.join(', ')}`);
    if (c.industria) lineas.push(`- INDUSTRIA: ${c.industria}`);
    if (lineas.length === 0) return '';
    return `\n\nCONTEXTO DEL CANDIDATO (úsalo para alinear el resumen al posicionamiento estratégico; NO inventes datos nuevos, solo refuerza con keywords presentes aquí cuando sean coherentes con el texto original):\n${lineas.join('\n')}`;
  })();

  const system = `Eres un Senior Career Coach experto en redacción profesional.
Tu tarea es optimizar el resumen del usuario para que sea claro, ejecutivo y sin sesgos.

REGLAS:
1. REESCRITURA: Mejora la redacción, gramática y vocabulario.
2. FIDELIDAD: No inventes datos. Usa solo la información proporcionada.
3. ESTRUCTURA: [Trayectoria] + [Especialidad] + [Valor Diferencial].
4. SÍNTESIS: Sé directo y profesional.
5. PRIMERA PERSONA: Usa "yo", "mis", "mi" — escribe como si la persona hablara de sí misma.
6. Responde únicamente con el párrafo optimizado en ${idioma === 'es' ? 'Español' : 'Inglés'}. Sin comillas ni explicaciones.${ctxBlock}`;

  try {
    const text = await complete({
      task: TASKS.CV_RESUMEN_OPTIMIZAR,
      system,
      messages: [{ role: 'user', content: `Optimiza este resumen profesional: "${texto}"` }],
      maxTokens: 1000,
      temperature: 0.3,
      tenant: ctx.tenant,
    });
    return text.trim().replace(/^["'«]+|["'»]+$/g, '').trim();
  } catch (error) {
    console.error('[cv.resumen.optimizar] Error:', error.message);
    return texto;
  }
}

// ── Fusiona resumen del CV + Oferta de Valor (PREMIUM no-PII, throw on error) ─
async function fusionarResumen(cvResumen, ofertaValor, idioma = 'es', ctx = {}) {
  const cv = String(cvResumen || '').trim();
  const ov = String(ofertaValor || '').trim();
  if (!cv && !ov) return '';
  if (!cv) return ov;
  if (!ov) return cv;

  const idiomaNombre = idioma === 'en' ? 'English' : 'Español neutro hispanoamericano';

  const system = `Eres un experto en redacción de CVs ejecutivos optimizados para ATS (Applicant Tracking Systems) y reclutadores senior. Tu única tarea es FUSIONAR dos textos en un resumen profesional cohesivo, literal y poderoso.

╔══════════════════════════════════════════════════════════════════════════╗
║  REGLA #1 (NO NEGOCIABLE): CERO INVENCIÓN                                 ║
║  Solo puedes usar información PRESENTE en uno de los dos textos.          ║
╚══════════════════════════════════════════════════════════════════════════╝

PROHIBIDO ABSOLUTAMENTE inventar, deducir o agregar:
  ✗ Métricas, porcentajes, cifras o años de experiencia que no estén en los inputs
  ✗ Empresas, cargos, sectores o industrias que no estén en los inputs
  ✗ Certificaciones, premios, idiomas o competencias que no estén en los inputs
  ✗ Cualquier hecho específico que no aparezca en uno de los dos textos

REGLAS DE FUSIÓN:
1. SÍNTESIS LITERAL: combina lo que dicen ambos textos sin contradicciones ni duplicaciones. Si un dato está en ambos, escríbelo una sola vez con la formulación más precisa.
2. PRIORIDAD: la EXPERIENCIA factual del CV manda; la OFERTA DE VALOR aporta posicionamiento estratégico, propósito y diferenciación.
3. OPTIMIZACIÓN ATS:
   - Usa keywords presentes en los inputs (cargos, industrias, metodologías, herramientas)
   - Verbos de acción profesionales (lidero, diseño, transformo, optimizo, gestiono, ejecuto, escalo)
   - Voz activa, sin pronombres personales (yo, mí, mi)
   - Sin clichés vacíos ("apasionado", "proactivo", "team player", "orientado a resultados" suelto)
4. ESTRUCTURA RECOMENDADA (3-5 oraciones):
   - Quién es + años de experiencia (si los hay en los inputs) + dominio/sector
   - Logros y métricas (SOLO si están en los inputs)
   - Competencias diferenciales (técnicas + estratégicas)
   - Visión / propósito profesional (de la oferta de valor)
5. LONGITUD: entre 500 y 900 caracteres. Máximo absoluto: 1000.
6. IDIOMA DE SALIDA: ${idiomaNombre}.

FORMATO DE RESPUESTA:
Devuelve SOLO el resumen fusionado. Sin preámbulos, sin etiquetas, sin comillas, sin explicaciones. Solo el texto del resumen profesional optimizado.`;

  const userMsg = `INPUT 1 — Resumen del CV original del candidato:
"""
${cv}
"""

INPUT 2 — Oferta de Valor del candidato (autoconocimiento del Gerente de Proyecto):
"""
${ov}
"""

Fusiona ambos en un único resumen profesional optimizado para ATS. Solo usa información presente en uno de los dos textos.`;

  try {
    const text = await complete({
      task: TASKS.CV_RESUMEN_FUSIONAR,
      system,
      messages: [{ role: 'user', content: userMsg }],
      maxTokens: 1200,
      temperature: 0.2,
      tenant: ctx.tenant,
    });
    return text.trim().replace(/^["'«]+|["'»]+$/g, '').trim();
  } catch (error) {
    console.error('[cv.resumen.fusionar] Error:', error.message);
    throw error;
  }
}

// ── Mejora la descripción de una experiencia (BULK no-PII, fallback al original) ─
async function optimizarDescripcionExp({ texto, cargo, empresa, idioma = 'es', contextoGerente = null }, ctx = {}) {
  if (!texto || texto.trim().length < 10) return texto;

  const lang = idioma === 'en' ? 'English' : idioma === 'pt' ? 'português' : 'español';
  const contexto = [cargo && `Cargo: ${cargo}`, empresa && `Empresa: ${empresa}`].filter(Boolean).join(' | ');

  const ctxBlock = (() => {
    if (!contextoGerente) return '';
    const c = contextoGerente;
    const lineas = [];
    if (Array.isArray(c.hard_skills) && c.hard_skills.length > 0) lineas.push(`- COMPETENCIAS TÉCNICAS objetivo: ${c.hard_skills.slice(0, 10).join(', ')}`);
    if (Array.isArray(c.soft_skills) && c.soft_skills.length > 0) lineas.push(`- COMPETENCIAS DE IMPACTO objetivo: ${c.soft_skills.slice(0, 8).join(', ')}`);
    if (Array.isArray(c.niveles_cargo) && c.niveles_cargo.length > 0) lineas.push(`- NIVEL JERÁRQUICO que busca: ${c.niveles_cargo.join(', ')}`);
    if (Array.isArray(c.areas) && c.areas.length > 0) lineas.push(`- ÁREAS de interés: ${c.areas.slice(0, 5).join(', ')}`);
    if (lineas.length === 0) return '';
    return `\n\nCONTEXTO ESTRATÉGICO (usa estos keywords cuando sean coherentes con el texto original; NO inventes experiencias nuevas):\n${lineas.join('\n')}`;
  })();

  const system = `Eres un Senior Career Coach experto en redacción de logros profesionales formato Harvard/Google para el mercado LATAM 2026.
Tu tarea es mejorar la descripción de una experiencia laboral.

PROCESO DE RAZONAMIENTO (aplica antes de escribir):
Paso 1 — Analiza el texto: ¿tiene bullets (•, -, *, números)? ¿hay dos secciones separadas como "Actividades" y "Logros"?
Paso 2 — Si tiene bullets: preserva la estructura (una idea por línea, cada línea empieza con "• ").
Paso 3 — Si hay secciones "Actividades"+"Logros" separadas: para cada actividad, encuentra su logro asociado y fusiónalo en un solo bullet coherente (Verbo + Acción + Resultado).
Paso 4 — Si es texto plano: reescríbelo en bullets con formato STAR.
Paso 5 — Aplica verbos de acción al inicio de cada punto.
Paso 6 — Añade métricas reales del texto; donde falten, usa [X%] / [N personas] / [$X] como placeholder.

REGLAS DE SALIDA:
- VERBOS DE ACCIÓN al inicio de cada bullet: Lideré, Implementé, Optimicé, Reduje, Gestioné, Desarrollé, Incrementé, Coordiné...
- FORMATO: cada bullet en su propia línea comenzando con "• " (excepto si el original era texto plano sin bullets).
- MÁXIMO 4-5 bullets. Sé preciso y ejecutivo.
- FIDELIDAD: No inventes empresas, cargos ni logros que no estén en el texto.
- IDIOMA: responde ÚNICAMENTE en ${lang}. No traduzcas si el original está en otro idioma.
- Responde SOLO con el texto mejorado (bullets o párrafo según análisis). Sin comillas, sin secciones, sin explicaciones.${ctxBlock}`;

  try {
    const text = await complete({
      task: TASKS.CV_DESCRIPCION_EXP,
      system,
      messages: [{ role: 'user', content: `${contexto ? `Contexto: ${contexto}\n` : ''}Mejora esta descripción de experiencia laboral:\n${texto}` }],
      maxTokens: 600,
      temperature: 0.3,
      tenant: ctx.tenant,
    });
    return text.trim().replace(/^["'«]+|["'»]+$/g, '').trim();
  } catch (error) {
    console.error('[cv.descripcionExp] Error:', error.message);
    return texto;
  }
}

// ── Extrae perfil estructurado desde el texto del CV (EXTRACCIÓN, PII-lock) ──
async function extractProfileFromCV(cvText, ctx = {}) {
  const fragmento = cvText; // el controlador ya limita el tamaño

  const prompt = `Eres un extractor de datos estructurados de CVs. Tu única tarea es leer el CV y devolver un JSON con los datos exactamente como aparecen, sin inventar, traducir ni interpretar.

REGLAS ESTRICTAS:
1. Devuelve ÚNICAMENTE JSON válido, sin texto extra, sin explicaciones, sin markdown.
2. Extrae los datos TAL COMO ESTÁN en el CV (no traduzcas nombres, empresas ni títulos).
3. Si un campo no existe, usa null. Arrays vacíos [] si no hay datos.
4. Para "idioma_cv": detecta el idioma principal del documento ("es", "en", "pt", "fr", "de", u otro código ISO 639-1).
5. Para "telefono1": extrae el número tal como aparece, incluyendo indicativo si existe.
6. Para "experiencias": extrae TODAS las entradas de experiencia laboral. Ponlas de MÁS RECIENTE a MÁS ANTIGUA (fecha_fin "Actualidad"/"Present"/"Presente" = más reciente, va primero).
7. Para "educacion": extrae TODA la formación académica.
8. "fecha_inicio" y "fecha_fin" deben ser strings como "2019-03", "2022" o "Actualidad"/"Present".
9. BULLET POINTS en "descripcion": Si el CV usa bullets (•, -, *, números) en la descripción de una experiencia, PRESERVA la estructura usando saltos de línea reales: cada bullet en su propia línea comenzando con "• ". Si el rol tiene DOS secciones separadas (ej: "Actividades" / "Responsabilidades" y "Logros" / "Achievements"), FUSIÓNOLAS inteligentemente: para cada actividad principal, crea un bullet que combine la actividad y su logro asociado en una sola línea coherente (Verbo + Acción + Resultado). No pierdas información.
10. Para "idiomas": devuelve un array de objetos con el nombre en ESPAÑOL y el nivel CEFR si aparece en el CV. Si no aparece el nivel, usa null.

CV A PROCESAR:
${fragmento}

Devuelve este JSON (respeta los nombres de campo exactamente):
{
  "idioma_cv": "es",
  "nombre1": "primer nombre",
  "nombre2": "segundo nombre o null",
  "apellido1": "primer apellido",
  "apellido2": "segundo apellido o null",
  "email": "email o null",
  "telefono1": "teléfono completo con indicativo o null",
  "ciudad": "ciudad o null",
  "pais": "país o null",
  "linkedin": "URL de LinkedIn o null",
  "cargo_actual": "cargo o título profesional principal o null",
  "resumen": "texto del resumen/perfil profesional copiado del CV o null",
  "años_experiencia": número entero estimado o null,
  "industria": "industria principal o null",
  "habilidades": ["habilidad1", "habilidad2"],
  "idiomas": [{ "idioma": "Español", "nivel": "Nativo" }, { "idioma": "Inglés", "nivel": "B2 o null si no está especificado" }],
  "educacion": [{ "titulo": "título exacto", "institucion": "institución exacta", "anio": "año de graduación o null" }],
  "experiencias": [{ "empresa": "empresa exacta", "cargo": "cargo exacto", "fecha_inicio": "YYYY-MM o YYYY", "fecha_fin": "YYYY-MM o YYYY o Actualidad", "descripcion": "texto con saltos de linea \\n• para bullets si aplica" }]
}`;

  const text = await complete({
    task: TASKS.CV_EXTRACT_PROFILE,
    messages: [{ role: 'user', content: prompt }],
    maxTokens: 2500,
    temperature: 0.1,
    tenant: ctx.tenant,
  });
  return JSON.parse(stripCodeFence(text));
}

module.exports = {
  optimizeCV,
  matchCVtoJob,
  extraerDatosInfografia,
  corregirProyectoLaboral,
  generarCarta,
  optimizarResumen,
  fusionarResumen,
  optimizarDescripcionExp,
  extractProfileFromCV,
};
