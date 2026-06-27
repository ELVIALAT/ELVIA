-- ============================================================
-- MIGRATION 20260623-00: companies.created_by (faltante por drift)
--
-- La columna created_by se definió solo en 20260101000007_tenant_branding
-- dentro de un `CREATE TABLE IF NOT EXISTS companies`. Como base_schema (000)
-- ya había creado la tabla, ese CREATE se saltó y created_by NUNCA se agregó.
--
-- El código (admin: POST /tenants la inserta, GET /companies la selecciona)
-- la asume existente → crear/listar tenants fallaba con
-- "column companies.created_by does not exist".
--
-- Esta migración la agrega de forma idempotente. created_by referencia al
-- super_admin que creó el tenant (auth.user.id == profiles.id). ON DELETE SET
-- NULL: borrar al admin no debe borrar las empresas que creó.
-- ============================================================

ALTER TABLE public.companies
  ADD COLUMN IF NOT EXISTS created_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL;

-- Índice para listar/filtrar por creador (opcional pero barato).
CREATE INDEX IF NOT EXISTS idx_companies_created_by ON public.companies(created_by);
