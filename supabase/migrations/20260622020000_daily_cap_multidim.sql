-- ============================================================
-- MIGRATION 20260622-02: Daily cap multi-dimensión (ADR-004)
-- Caps de IA en 3 dimensiones: global, per-tenant, per-user.
-- Razón: en el tenant genérico 'publico' los usuarios son extraños
-- entre sí; un solo cap per-tenant lo convertiría en vector de DoS
-- económico entre usuarios B2C. Por eso TAMBIÉN cap per-user.
-- ============================================================

-- ─────────────────────────────────────────────────────────────
-- 1. Caps configurables por compañía (NULL = usar default global)
-- ─────────────────────────────────────────────────────────────
ALTER TABLE public.companies
  ADD COLUMN IF NOT EXISTS daily_cap_tenant INTEGER,   -- tope diario del tenant completo
  ADD COLUMN IF NOT EXISTS daily_cap_user   INTEGER;   -- tope diario por usuario del tenant

-- ─────────────────────────────────────────────────────────────
-- 2. Tabla de contadores con scope (per-tenant y per-user)
--    scope_type: 'tenant' | 'user' ; scope_id: company_id o user_id
-- ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.daily_usage_scoped (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  date        DATE NOT NULL DEFAULT CURRENT_DATE,
  scope_type  TEXT NOT NULL CHECK (scope_type IN ('tenant', 'user')),
  scope_id    UUID NOT NULL,
  count       INTEGER NOT NULL DEFAULT 0,
  UNIQUE (date, scope_type, scope_id)
);

CREATE INDEX IF NOT EXISTS idx_daily_usage_scoped_lookup
  ON public.daily_usage_scoped (date, scope_type, scope_id);

ALTER TABLE public.daily_usage_scoped ENABLE ROW LEVEL SECURITY;
-- Solo el backend (service_role) lo toca; sin políticas = sin acceso desde clientes.

-- ─────────────────────────────────────────────────────────────
-- 3. RPC atómica multi-dimensión.
--    Verifica e incrementa global → tenant → user en una transacción.
--    Si CUALQUIER dimensión está en su tope, NO incrementa ninguna y
--    devuelve allowed=false con el scope que bloqueó.
--    Defaults: global 1000/día, tenant 500/día, user 50/día (override por companies.*).
-- ─────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION increment_daily_cap_v2(
  p_date       date,
  p_company_id uuid DEFAULT NULL,
  p_user_id    uuid DEFAULT NULL
)
RETURNS TABLE (allowed boolean, blocked_scope text, current_count integer, max_count integer)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_global_max   integer := 1000;
  v_tenant_max   integer;
  v_user_max     integer;
  v_global_count integer;
  v_tenant_count integer;
  v_user_count   integer;
BEGIN
  -- Resolver topes del tenant (override) o defaults
  IF p_company_id IS NOT NULL THEN
    SELECT COALESCE(daily_cap_tenant, 500), COALESCE(daily_cap_user, 50)
    INTO v_tenant_max, v_user_max
    FROM companies WHERE id = p_company_id;
    v_tenant_max := COALESCE(v_tenant_max, 500);
    v_user_max   := COALESCE(v_user_max, 50);
  ELSE
    v_tenant_max := 500;
    v_user_max   := 50;
  END IF;

  -- ── Dimensión GLOBAL (reusa daily_usage_cap) ──
  INSERT INTO daily_usage_cap (date, analyses_count, max_daily_analyses)
  VALUES (p_date, 0, v_global_max)
  ON CONFLICT (date) DO NOTHING;

  SELECT analyses_count INTO v_global_count FROM daily_usage_cap WHERE date = p_date;
  IF v_global_count >= v_global_max THEN
    RETURN QUERY SELECT false, 'global', v_global_count, v_global_max;
    RETURN;
  END IF;

  -- ── Dimensión TENANT ──
  IF p_company_id IS NOT NULL THEN
    INSERT INTO daily_usage_scoped (date, scope_type, scope_id, count)
    VALUES (p_date, 'tenant', p_company_id, 0)
    ON CONFLICT (date, scope_type, scope_id) DO NOTHING;

    SELECT count INTO v_tenant_count
    FROM daily_usage_scoped WHERE date = p_date AND scope_type = 'tenant' AND scope_id = p_company_id;
    IF v_tenant_count >= v_tenant_max THEN
      RETURN QUERY SELECT false, 'tenant', v_tenant_count, v_tenant_max;
      RETURN;
    END IF;
  END IF;

  -- ── Dimensión USER ──
  IF p_user_id IS NOT NULL THEN
    INSERT INTO daily_usage_scoped (date, scope_type, scope_id, count)
    VALUES (p_date, 'user', p_user_id, 0)
    ON CONFLICT (date, scope_type, scope_id) DO NOTHING;

    SELECT count INTO v_user_count
    FROM daily_usage_scoped WHERE date = p_date AND scope_type = 'user' AND scope_id = p_user_id;
    IF v_user_count >= v_user_max THEN
      RETURN QUERY SELECT false, 'user', v_user_count, v_user_max;
      RETURN;
    END IF;
  END IF;

  -- ── Todas las dimensiones OK → incrementar todas ──
  UPDATE daily_usage_cap SET analyses_count = analyses_count + 1 WHERE date = p_date;

  IF p_company_id IS NOT NULL THEN
    UPDATE daily_usage_scoped SET count = count + 1
    WHERE date = p_date AND scope_type = 'tenant' AND scope_id = p_company_id;
  END IF;

  IF p_user_id IS NOT NULL THEN
    UPDATE daily_usage_scoped SET count = count + 1
    WHERE date = p_date AND scope_type = 'user' AND scope_id = p_user_id;
  END IF;

  RETURN QUERY SELECT true, NULL::text, v_global_count + 1, v_global_max;
END;
$$;
