// jobs.repository — ÚNICA capa del módulo que toca Supabase (cache job_checks).

// Cache de compatibilidad por job_key (cargo|empresa).
async function getCachedCheck(db, jobKey) {
  const { data } = await db
    .from('job_checks')
    .select('score, motivos')
    .eq('job_key', jobKey)
    .maybeSingle();
  return data || null;
}

async function saveCheck(db, userId, { jobKey, score, motivos, jobData }) {
  await db.from('job_checks').insert({
    user_id: userId, job_key: jobKey, score, motivos, job_data: jobData,
  });
}

module.exports = { getCachedCheck, saveCheck };
