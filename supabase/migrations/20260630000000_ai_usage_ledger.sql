-- Migration: ai_usage_ledger
-- Refactor #1 (capa de IA) paso 4 — registro de costo de IA por tenant.
-- Telemetría interna: solo el backend (service_role) escribe/lee. Guarda TOKENS crudos;
-- el costo USD se computa en la app con tarifas actualizables (platform/ai/cost/rates.js).

CREATE TABLE IF NOT EXISTS ai_usage (
  id                 BIGINT      GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  company_id         UUID,       -- tenant; sin FK a propósito: la telemetría nunca debe fallar el insert
  user_id            UUID,
  task               TEXT        NOT NULL,
  provider           TEXT        NOT NULL,
  model              TEXT        NOT NULL,
  input_tokens       INTEGER     NOT NULL DEFAULT 0,
  output_tokens      INTEGER     NOT NULL DEFAULT 0,
  cache_read_tokens  INTEGER     NOT NULL DEFAULT 0,
  cache_write_tokens INTEGER     NOT NULL DEFAULT 0,
  created_at         TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Agregaciones del dashboard: por tenant + rango de fecha, y barrido global por fecha.
CREATE INDEX IF NOT EXISTS ai_usage_company_created_idx ON ai_usage (company_id, created_at DESC);
CREATE INDEX IF NOT EXISTS ai_usage_created_idx         ON ai_usage (created_at DESC);

-- RLS: telemetría interna. SIN políticas → ningún rol anon/authenticated puede leer ni escribir.
-- El backend usa service_role (bypassa RLS) para insertar y para el dashboard de super_admin.
ALTER TABLE ai_usage ENABLE ROW LEVEL SECURITY;

-- Agregación para el dashboard de costo (super_admin). Agrupa por tenant + modelo para que
-- el backend compute el costo con la tarifa correcta de cada modelo (platform/ai/cost/rates.js).
CREATE OR REPLACE FUNCTION ai_usage_summary(p_since TIMESTAMPTZ)
RETURNS TABLE (
  company_id         UUID,
  provider           TEXT,
  model              TEXT,
  calls              BIGINT,
  input_tokens       BIGINT,
  output_tokens      BIGINT,
  cache_read_tokens  BIGINT,
  cache_write_tokens BIGINT
)
LANGUAGE sql STABLE AS $$
  SELECT company_id, provider, model,
         count(*)::bigint                  AS calls,
         sum(input_tokens)::bigint         AS input_tokens,
         sum(output_tokens)::bigint        AS output_tokens,
         sum(cache_read_tokens)::bigint    AS cache_read_tokens,
         sum(cache_write_tokens)::bigint   AS cache_write_tokens
  FROM ai_usage
  WHERE created_at >= p_since
  GROUP BY company_id, provider, model;
$$;

-- La función es de uso interno del backend (service_role). No exponerla a anon/authenticated.
REVOKE ALL ON FUNCTION ai_usage_summary(TIMESTAMPTZ) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION ai_usage_summary(TIMESTAMPTZ) TO service_role;
