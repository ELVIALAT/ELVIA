// interview.repository — ÚNICA capa del módulo que toca Supabase.

// Guarda el reporte de una entrevista simulada en cv_results (TTL soft 14 días).
async function saveReport(db, userId, { resultado, preguntas, respuestas, cargo, empresa, entrevistador }) {
  const expiresAt = new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString();
  const { error } = await db.from('cv_results').insert({
    user_id: userId,
    tipo: 'optimize',
    contenido: JSON.stringify({ resultado, preguntas, respuestas }),
    metadata: {
      subtipo: 'entrevista_simulada',
      cargo,
      empresa: empresa || '',
      entrevistador: entrevistador || 'HR',
      puntuacion: resultado.puntuacion,
      resumen: resultado.resumen,
      expires_at: expiresAt,
      filename: `Entrevista ${cargo}${empresa ? ' — ' + empresa : ''} ${new Date().toISOString().slice(0, 10)}`,
    },
  });
  if (error) console.error('[interview.repo] saveReport:', error.message);
}

module.exports = { saveReport };
