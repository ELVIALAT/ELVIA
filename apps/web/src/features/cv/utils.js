// features/cv/utils.js
// Helpers puros (análisis de calidad, % de llenado, tips contextuales, parseo de fechas)
// de la Factoría CV. Extraído verbatim desde pages/CVDesdeCero.jsx (Fase 3).

// ─── Análisis de calidad (estándares Harvard / LATAM 2026) ───────────────────
// Basado en calificacioncv.md — Metodología STAR/Google
// Distribución: Encabezado 18 | Resumen 20 | Experiencia 30 | Educación 15 | Habilidades 10 | Idiomas 7 = 100
const VERBOS_ACCION = ['lider', 'implement', 'negoci', 'optimiz', 'increment', 'reduci', 'gestion', 'desarroll', 'coordin', 'supervis', 'direct', 'lanz', 'mejor', 'transform', 'ejecut', 'logr', 'cre', 'diseñ', 'capaci', 'consolid']

export function analizarCalidad(d) {
  let pts = 0
  const recs = []

  // ── 1. Encabezado (18 pts) ─────────────────────────────────────────────────
  if (d.nombre && d.apellido) pts += 8; else recs.push('Completa tu nombre y apellido completo')
  if (d.email)                pts += 3; else recs.push('Agrega un correo electrónico profesional (nombre.apellido@...)')
  if (d.telefono)             pts += 4; else recs.push('Agrega tu número de teléfono con código de área internacional')
  if (d.ciudad && d.pais)     pts += 3; else recs.push('Especifica tu ciudad y país (sin dirección exacta)')

  // ── 2. Resumen de valor (20 pts) ───────────────────────────────────────────
  const resumen = d.resumen || ''
  if      (resumen.length >= 200) pts += 20
  else if (resumen.length >= 100) pts += 13
  else if (resumen.length >   30) pts += 6
  else recs.push('Agrega un resumen de valor (3-5 líneas): años de exp. + sector + logro cuantificado')
  if (resumen.length > 30 && resumen.length < 100) {
    recs.push('Expande tu resumen — incluye años de experiencia, sector y al menos un logro con número')
  }

  // ── 3. Experiencia — STAR/Google (30 pts) ─────────────────────────────────
  const expOk = (d.experiencias || []).filter(e => e.empresa && e.cargo)
  if      (expOk.length >= 3) pts += 15
  else if (expOk.length === 2) pts += 10
  else if (expOk.length === 1) pts += 5
  if (expOk.length === 0) recs.push('Agrega al menos una experiencia laboral con empresa, cargo y logros')
  else if (expOk.length === 1) recs.push('Intenta agregar 2+ experiencias — refuerza mucho tu credibilidad')

  const expConDesc = expOk.filter(e => e.descripcion && e.descripcion.length > 20)
  if (expOk.length > 0 && expConDesc.length === 0) {
    recs.push('Describe tus logros en cada rol (fórmula STAR: Verbo de acción + Métrica + Resultado)')
  } else if (expConDesc.length > 0) {
    const tieneMetricas = expConDesc.some(e => /[\d%$€£]/.test(e.descripcion))
    const tieneVerbos   = expConDesc.some(e => {
      const desc = e.descripcion.toLowerCase()
      return VERBOS_ACCION.some(v => desc.includes(v))
    })
    if (tieneMetricas) pts += 10; else recs.push('Cuantifica al menos un logro con números o porcentajes (ej: "Incrementé ventas en 18%")')
    if (tieneVerbos)   pts +=  5; else recs.push('Empieza cada logro con un verbo de acción: Lideré, Implementé, Optimicé, Negocié...')
  }

  // ── 4. Educación (15 pts) ──────────────────────────────────────────────────
  const eduOk = (d.educacion || []).filter(e => e.institucion && e.titulo)
  if      (eduOk.length >= 2) pts += 15
  else if (eduOk.length === 1) pts += 12
  else recs.push('Agrega tu formación académica (institución + título + año)')

  // ── 5. Habilidades (10 pts) ────────────────────────────────────────────────
  const numH = (d.habilidades || []).length
  if      (numH >= 8) pts += 10
  else if (numH >= 5) pts += 7
  else if (numH >= 3) pts += 4
  else if (numH >= 1) pts += 2
  if (numH < 5) recs.push('Agrega al menos 5 habilidades clave (técnicas + blandas) — mejora el score ATS')

  // ── 6. Idiomas (7 pts — ATS) ──────────────────────────────────────────────
  const numI = (d.idiomas || []).length
  if      (numI >= 2) pts += 7
  else if (numI === 1) pts += 4
  if (numI === 0) recs.push('Agrega idiomas con nivel CEFR (C1, B2, etc.) — el 75% de CVs sin idiomas son rechazados por ATS')

  const porcentaje = Math.min(Math.round(pts), 100)
  return {
    porcentaje,
    estado: porcentaje >= 80 ? 'Excelente' : porcentaje >= 60 ? 'Bueno' : porcentaje >= 40 ? 'Incompleto' : 'Muy incompleto',
    nivel:  porcentaje >= 80 ? 'green' : porcentaje >= 60 ? 'amber' : 'red',
    recs,
  }
}

// ─── % de llenado del wizard ──────────────────────────────────────────────────
export function calcularLlenado(d) {
  let pts = 0
  if (d.nombre && d.apellido) pts += 2
  if (d.email)   pts++
  if (d.telefono) pts++
  if (d.ciudad && d.pais) pts += 2
  if (d.resumen && d.resumen.length > 30) pts++
  if ((d.experiencias || []).some(e => e.empresa && e.cargo)) pts++
  if ((d.educacion || []).some(e => e.institucion && e.titulo)) pts++
  if ((d.habilidades || []).length >= 3) pts++
  if ((d.idiomas || []).length >= 1) pts++
  return Math.round((pts / 11) * 100)
}

// ─── Tips contextuales por sección ────────────────────────────────────────────
export function generarTipsPorPaso(d) {
  const tips = { datos: [], resumen: [], experiencia: [], educacion: [], habilidades: [], idiomas: [] }

  // Datos personales
  if (!d.nombre || !d.apellido) tips.datos.push('Agrega tu nombre y apellido completo')
  if (!d.email) tips.datos.push('Agrega un correo profesional (nombre.apellido@...)')
  if (!d.telefono) tips.datos.push('Incluye tu teléfono con código internacional (+52, +57, etc.)')
  if (!d.ciudad || !d.pais) tips.datos.push('Especifica ciudad y país — mejora el match con vacantes locales')

  // Resumen
  const res = d.resumen || ''
  if (res.length < 100) tips.resumen.push('Escribe un resumen de 200–500 caracteres con años de experiencia + sector + logro clave')
  else if (res.length < 200) tips.resumen.push('Expande tu resumen: incluye sector, cargo objetivo y al menos un logro con número')
  if (res.length > 30 && !/\d/.test(res)) tips.resumen.push('Agrega un dato cuantificable (%, $, años, personas a cargo, volumen de negocio)')

  // Experiencia
  const exps = (d.experiencias || []).filter(e => e.empresa || e.cargo || e.descripcion)
  if (exps.length === 0) {
    tips.experiencia.push('Agrega al menos una experiencia laboral con cargo y empresa')
  } else {
    const sinDesc = exps.filter(e => !e.descripcion || e.descripcion.length < 60)
    if (sinDesc.length > 0) tips.experiencia.push(`${sinDesc.length} experiencia(s) sin descripción. Usa STAR: Acción + Métrica + Resultado (ej: "Lideré migración que redujo costos 30%")`)
    const sinMetrica = exps.filter(e => e.descripcion && !/\d/.test(e.descripcion))
    if (sinMetrica.length > 0) tips.experiencia.push('Agrega métricas: % de crecimiento, equipo a cargo, presupuesto gestionado, # clientes')
    const sinVerbo = exps.filter(e => e.descripcion && !VERBOS_ACCION.some(v => e.descripcion.toLowerCase().includes(v)))
    if (sinVerbo.length > 0) tips.experiencia.push('Usa verbos de impacto al inicio: "Implementé", "Lideré", "Incrementé", "Reduje", "Gestioné"')
    const sinFechas = exps.filter(e => !e.fecha_inicio)
    if (sinFechas.length > 0) tips.experiencia.push('Completa las fechas de inicio y fin para mostrar trayectoria clara')
  }

  // Educación
  const edu = (d.educacion || []).filter(e => e.institucion || e.titulo)
  if (edu.length === 0) tips.educacion.push('Agrega tu formación académica (institución, título, año)')
  else {
    const sinAnio = edu.filter(e => !e.anio)
    if (sinAnio.length > 0) tips.educacion.push('Agrega el año de graduación en tus estudios para validar antigüedad')
  }

  // Habilidades
  const numHabs = (d.habilidades || []).length
  if (numHabs === 0) tips.habilidades.push('Agrega habilidades clave de tu industria (mínimo 5)')
  else if (numHabs < 5) tips.habilidades.push(`Tienes ${numHabs} habilidad(es). Agrega más hasta llegar a 8–12 para mejor match con vacantes`)

  // Idiomas
  if (!d.idiomas || d.idiomas.length === 0) {
    tips.idiomas.push('Agrega al menos tu idioma nativo y el nivel CEFR')
    tips.idiomas.push('El inglés (aunque sea B1) abre oportunidades en empresas multinacionales')
  } else if (!d.idiomas.some(i => i.idioma === 'Inglés')) {
    tips.idiomas.push('Si tienes algo de inglés, agrégalo — incluso nivel B1 puede ser diferenciador')
  }

  return tips
}

// ─── Parseo de año de fecha_fin para ordenar experiencias ─────────────────────
// "Actualidad"/"Present"/null → más reciente (9999)
export const parseExpYear = (fin) => {
  if (!fin || /actual|present|current|hoy|vigente/i.test(fin)) return 9999
  const m = String(fin).match(/\d{4}/)
  return m ? parseInt(m[0], 10) : 0
}
