-- ============================================================
-- MIGRATION 000: Base Schema — tablas fundacionales de ELVIA
-- Debe ejecutarse ANTES que cualquier otra migration.
-- Crea las tablas que Supabase Auth no crea automáticamente.
-- ============================================================

-- Extensiones requeridas
CREATE EXTENSION IF NOT EXISTS "pgcrypto";
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ─────────────────────────────────────────────────────────────
-- 1. COMPANIES (tenant raíz del sistema B2B)
-- ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.companies (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name              TEXT NOT NULL,
  email_contacto    TEXT,
  logo_url          TEXT,
  daily_cap         INTEGER NOT NULL DEFAULT 200,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.companies ENABLE ROW LEVEL SECURITY;

-- ─────────────────────────────────────────────────────────────
-- 2. PROFILES (extiende auth.users, 1:1)
-- ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.profiles (
  id                      UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email_principal         TEXT,
  nombre1                 TEXT,
  apellido1               TEXT,
  is_admin                BOOLEAN NOT NULL DEFAULT false,
  suspended               BOOLEAN NOT NULL DEFAULT false,
  plan                    TEXT NOT NULL DEFAULT 'free',
  usage_count             INTEGER NOT NULL DEFAULT 0,
  cv_optimizer_count      INTEGER NOT NULL DEFAULT 0,
  cv_match_count          INTEGER NOT NULL DEFAULT 0,
  plan_expires_at         TIMESTAMPTZ,
  free_trial_expires_at   TIMESTAMPTZ,
  company_id              UUID REFERENCES public.companies(id) ON DELETE SET NULL,
  role                    TEXT NOT NULL DEFAULT 'collaborator',
  created_at              TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at              TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_profiles_plan            ON public.profiles(plan);
CREATE INDEX IF NOT EXISTS idx_profiles_trial           ON public.profiles(free_trial_expires_at);
CREATE INDEX IF NOT EXISTS idx_profiles_plan_expires    ON public.profiles(plan_expires_at);
CREATE INDEX IF NOT EXISTS idx_profiles_company_id      ON public.profiles(company_id);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Trigger para propagar updated_at
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END;
$$;

DROP TRIGGER IF EXISTS trg_profiles_updated_at ON public.profiles;
CREATE TRIGGER trg_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- Auto-crear perfil al registrarse en Auth
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.profiles (id, email_principal)
  VALUES (NEW.id, NEW.email)
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ─────────────────────────────────────────────────────────────
-- 3. CV_RESULTS
-- ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.cv_results (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  company_id  UUID REFERENCES public.companies(id) ON DELETE SET NULL,
  tipo        TEXT NOT NULL DEFAULT 'optimize',
  contenido   TEXT,
  metadata    JSONB,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_cv_results_user_id    ON public.cv_results(user_id);
CREATE INDEX IF NOT EXISTS idx_cv_results_company_id ON public.cv_results(company_id);

ALTER TABLE public.cv_results ENABLE ROW LEVEL SECURITY;

-- ─────────────────────────────────────────────────────────────
-- 3b. LINKEDIN_ANALYSES (historial de análisis LinkedIn® Pro)
--     Creada aquí en base porque migrations posteriores (011, 015)
--     la referencian antes de su CREATE original (timestamp 20260503).
-- ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.linkedin_analyses (
  id                UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id           UUID        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  company_id        UUID        REFERENCES public.companies(id) ON DELETE SET NULL,
  puntaje_global    INTEGER     NOT NULL CHECK (puntaje_global BETWEEN 0 AND 100),
  resumen_global    TEXT,
  top_acciones      JSONB       NOT NULL DEFAULT '[]',
  secciones         JSONB       NOT NULL DEFAULT '{}',
  campos_analizados TEXT[]      DEFAULT '{}',
  created_at        TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS linkedin_analyses_user_id_created_at
  ON public.linkedin_analyses (user_id, created_at DESC);

ALTER TABLE public.linkedin_analyses ENABLE ROW LEVEL SECURITY;

-- ─────────────────────────────────────────────────────────────
-- 4. JOB_CHECKS (cache CV vs vacante)
-- ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.job_checks (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  company_id  UUID REFERENCES public.companies(id) ON DELETE SET NULL,
  job_key     TEXT NOT NULL,
  score       INTEGER CHECK (score BETWEEN 0 AND 100),
  motivos     JSONB,
  job_data    JSONB,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_job_checks_user_id    ON public.job_checks(user_id);
CREATE INDEX IF NOT EXISTS idx_job_checks_job_key    ON public.job_checks(job_key);
CREATE INDEX IF NOT EXISTS idx_job_checks_company_id ON public.job_checks(company_id);

ALTER TABLE public.job_checks ENABLE ROW LEVEL SECURITY;

-- ─────────────────────────────────────────────────────────────
-- 5. DAILY_USAGE_CAP (hard cap global de IA)
-- ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.daily_usage_cap (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  date                DATE UNIQUE NOT NULL DEFAULT CURRENT_DATE,
  analyses_count      INTEGER NOT NULL DEFAULT 0,
  max_daily_analyses  INTEGER NOT NULL DEFAULT 100
);

-- ─────────────────────────────────────────────────────────────
-- 6. ACCESS_CODES
-- ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.access_codes (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code        TEXT UNIQUE NOT NULL,
  plan        TEXT NOT NULL,
  max_uses    INTEGER NOT NULL DEFAULT 1,
  uses_count  INTEGER NOT NULL DEFAULT 0,
  expires_at  TIMESTAMPTZ,
  notes       TEXT,
  is_active   BOOLEAN NOT NULL DEFAULT true,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_access_codes_code      ON public.access_codes(code);
CREATE INDEX IF NOT EXISTS idx_access_codes_is_active ON public.access_codes(is_active);

ALTER TABLE public.access_codes ENABLE ROW LEVEL SECURITY;

-- ─────────────────────────────────────────────────────────────
-- 7. CODE_REDEMPTIONS
-- ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.code_redemptions (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code_id      UUID NOT NULL REFERENCES public.access_codes(id) ON DELETE CASCADE,
  user_id      UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  plan_granted TEXT,
  redeemed_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, code_id)
);

CREATE INDEX IF NOT EXISTS idx_redemptions_user_id ON public.code_redemptions(user_id);
CREATE INDEX IF NOT EXISTS idx_redemptions_code_id ON public.code_redemptions(code_id);

ALTER TABLE public.code_redemptions ENABLE ROW LEVEL SECURITY;

-- Trigger para incrementar uses_count al redimir
CREATE OR REPLACE FUNCTION public.fn_increment_code_uses()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  UPDATE public.access_codes SET uses_count = uses_count + 1 WHERE id = NEW.code_id;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_increment_code_uses ON public.code_redemptions;
CREATE TRIGGER trg_increment_code_uses
  AFTER INSERT ON public.code_redemptions
  FOR EACH ROW EXECUTE FUNCTION public.fn_increment_code_uses();

-- ─────────────────────────────────────────────────────────────
-- 8. DELETION_AUDIT_LOG
-- ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.deletion_audit_log (
  id                   UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  deleted_user_id      UUID NOT NULL,
  deleted_user_email   VARCHAR(255),
  admin_id             UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  admin_email          VARCHAR(255),
  reason               VARCHAR(500),
  status               VARCHAR(50) NOT NULL DEFAULT 'pending',
  error_message        TEXT,
  created_at           TIMESTAMPTZ NOT NULL DEFAULT now(),
  completed_at         TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_deletion_audit_user_id    ON public.deletion_audit_log(deleted_user_id);
CREATE INDEX IF NOT EXISTS idx_deletion_audit_admin_id   ON public.deletion_audit_log(admin_id);
CREATE INDEX IF NOT EXISTS idx_deletion_audit_created_at ON public.deletion_audit_log(created_at);

ALTER TABLE public.deletion_audit_log ENABLE ROW LEVEL SECURITY;

-- ─────────────────────────────────────────────────────────────
-- 9. WAITLIST_LEADS
-- ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.waitlist_leads (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nombre     TEXT NOT NULL CHECK (char_length(nombre) BETWEEN 2 AND 100),
  apellido   TEXT NOT NULL CHECK (char_length(apellido) BETWEEN 2 AND 100),
  telefono   TEXT,
  pais       TEXT,
  email      VARCHAR(255) UNIQUE NOT NULL,
  situacion  TEXT DEFAULT 'whitelist-validated',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_waitlist_leads_email ON public.waitlist_leads(email);

-- ─────────────────────────────────────────────────────────────
-- 10. LANDING_EVENTS (analytics anónimos)
-- ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.landing_events (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_name TEXT NOT NULL,
  metadata   JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_landing_events_event_name ON public.landing_events(event_name);

-- ─────────────────────────────────────────────────────────────
-- 11. LANDING_CONFIG
-- ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.landing_config (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  config_key   TEXT UNIQUE NOT NULL,
  config_value TEXT,
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ─────────────────────────────────────────────────────────────
-- 12. LANDING_STATS
-- ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.landing_stats (
  id           INT PRIMARY KEY DEFAULT 1,
  views        INT NOT NULL DEFAULT 0,
  last_updated TIMESTAMPTZ DEFAULT now(),
  CONSTRAINT ck_landing_stats_views CHECK (views >= 0),
  CONSTRAINT ck_landing_stats_id CHECK (id = 1)
);

INSERT INTO public.landing_stats (id, views) VALUES (1, 0) ON CONFLICT (id) DO NOTHING;

-- ─────────────────────────────────────────────────────────────
-- 13. JOB_SEARCH_PROFILE (Gerente de Búsqueda — 6 pilares)
--     OJO: NO es tabla. El frontend lo trata como columna JSONB de
--     profiles: profiles.update({ job_search_profile: {...} }).
--     Se agrega como columna; toda la estructura de pilares vive en el JSON.
-- ─────────────────────────────────────────────────────────────
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS job_search_profile JSONB NOT NULL DEFAULT '{}'::jsonb;

-- ─────────────────────────────────────────────────────────────
-- 14. SAVED_JOBS (vacantes guardadas — esquema completo para migration 010)
-- ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.saved_jobs (
  id            UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id       UUID        NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  company_id    UUID        REFERENCES public.companies(id) ON DELETE SET NULL,
  titulo        TEXT,
  empresa       TEXT,
  descripcion   TEXT,
  job_data      JSONB,
  job_key       TEXT,
  estado        TEXT        NOT NULL DEFAULT 'Descubierto',
  etapas_fechas JSONB       NOT NULL DEFAULT '{}'::jsonb,
  notas         TEXT,
  contacto      JSONB       NOT NULL DEFAULT '{}'::jsonb,
  liked         BOOLEAN     NOT NULL DEFAULT false,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_saved_jobs_user_id    ON public.saved_jobs(user_id);
CREATE INDEX IF NOT EXISTS idx_saved_jobs_company_id ON public.saved_jobs(company_id);

ALTER TABLE public.saved_jobs ENABLE ROW LEVEL SECURITY;
