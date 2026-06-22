-- ============================================================
-- MIGRATION 20260622-01: Tenant genérico 'publico' (ex-B2C)
-- Decisión ADR-004: los usuarios B2C viven en un tenant genérico
-- explícito, nunca con company_id null.
-- También corrige companies.nombre → companies.name (el código usa .name).
-- ============================================================

-- ─────────────────────────────────────────────────────────────
-- 1. companies.name — el código (admin.js, company.js) usa `name`,
--    pero base_schema 000 creó `nombre`. Unificar a `name`.
-- ─────────────────────────────────────────────────────────────

ALTER TABLE public.companies ADD COLUMN IF NOT EXISTS name TEXT;

-- Copiar datos de nombre→name si la columna vieja existe y name está vacío
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'companies' AND column_name = 'nombre'
  ) THEN
    UPDATE public.companies SET name = nombre WHERE name IS NULL;
    -- Quitar el NOT NULL de la columna vieja para que no bloquee inserts que usan `name`
    ALTER TABLE public.companies ALTER COLUMN nombre DROP NOT NULL;
  END IF;
END $$;

-- ─────────────────────────────────────────────────────────────
-- 2. companies.type — distingue consumer (B2C) de corporate (B2B)
-- ─────────────────────────────────────────────────────────────

ALTER TABLE public.companies
  ADD COLUMN IF NOT EXISTS type TEXT NOT NULL DEFAULT 'corporate';

-- ─────────────────────────────────────────────────────────────
-- 3. Sembrar el tenant genérico 'publico' (infra, no demo)
--    self-signup abierto: sin invitación ni allowlist.
-- ─────────────────────────────────────────────────────────────

INSERT INTO public.companies (name, slug, type, sector, country, is_active, require_invite, require_allowlist)
VALUES ('ELVIA', 'publico', 'consumer', 'general', 'MX', true, false, false)
ON CONFLICT (slug) DO UPDATE
  SET type = 'consumer', is_active = true, require_invite = false, require_allowlist = false;

DO $$
DECLARE pub_id UUID;
BEGIN
  SELECT id INTO pub_id FROM public.companies WHERE slug = 'publico';
  RAISE NOTICE 'Tenant genérico publico listo. company_id = %', pub_id;
END $$;
