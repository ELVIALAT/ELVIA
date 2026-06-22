-- ============================================================
-- MIGRATION 20260622: Correcciones al base_schema (000)
-- 1. job_search_profile NO es tabla: es columna JSONB de profiles
--    (el frontend hace profiles.update({ job_search_profile: {...} }))
-- 2. user_events: tabla de tracking que faltaba (usada por useTrackEvent)
-- ============================================================

-- ─────────────────────────────────────────────────────────────
-- 1. job_search_profile como COLUMNA JSONB en profiles
-- ─────────────────────────────────────────────────────────────

-- Eliminar la tabla mal modelada del base_schema 000
DROP TABLE IF EXISTS public.job_search_profile CASCADE;

-- Agregar como columna JSONB (lo que el frontend espera)
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS job_search_profile JSONB NOT NULL DEFAULT '{}'::jsonb;

-- ─────────────────────────────────────────────────────────────
-- 2. user_events (tracking de actividad — useTrackEvent.js)
-- ─────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.user_events (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id       UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  event         TEXT NOT NULL,
  feature       TEXT,
  page          TEXT,
  metadata      JSONB DEFAULT '{}'::jsonb,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_user_events_user_id    ON public.user_events(user_id);
CREATE INDEX IF NOT EXISTS idx_user_events_created_at ON public.user_events(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_user_events_feature    ON public.user_events(feature);

ALTER TABLE public.user_events ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "usuarios insertan sus eventos" ON public.user_events;
CREATE POLICY "usuarios insertan sus eventos"
  ON public.user_events FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "admin lee todos los eventos" ON public.user_events;
CREATE POLICY "admin lee todos los eventos"
  ON public.user_events FOR SELECT
  TO authenticated
  USING (true);

-- ─────────────────────────────────────────────────────────────
-- 3. RLS en profiles: el usuario lee/actualiza su propia fila
--    (faltaban políticas → select daba 500/sin filas)
-- ─────────────────────────────────────────────────────────────

DROP POLICY IF EXISTS "profiles_select_own" ON public.profiles;
CREATE POLICY "profiles_select_own"
  ON public.profiles FOR SELECT
  TO authenticated
  USING (
    auth.uid() = id
    OR EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.is_admin = true)
  );

DROP POLICY IF EXISTS "profiles_update_own" ON public.profiles;
CREATE POLICY "profiles_update_own"
  ON public.profiles FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

DROP POLICY IF EXISTS "profiles_insert_own" ON public.profiles;
CREATE POLICY "profiles_insert_own"
  ON public.profiles FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = id);
