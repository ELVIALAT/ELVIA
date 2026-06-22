-- ============================================================
-- MIGRATION 20260622-03: Fix recursión infinita en RLS de profiles
-- BUG: DOS políticas de profiles hacían subqueries a profiles DENTRO de
--   la política de profiles → "infinite recursion detected in policy".
--   Efecto: ningún usuario podía leer ni su PROPIO profile vía RLS.
--   (1) profiles_select_own (migration 20260622-00): EXISTS(SELECT ... profiles)
--   (2) company_admin_view_own_company (migration 004): 3x SELECT ... profiles
-- FIX: funciones SECURITY DEFINER (no re-evalúan RLS) + eliminar la
--   política company_admin recursiva. El company_admin NO debe leer filas
--   individuales por RLS de todos modos (M015: lo hace vía backend service_role).
-- ============================================================

-- Helper: company_id del usuario actual, sin recursión (SECURITY DEFINER).
CREATE OR REPLACE FUNCTION public.current_user_company_id()
RETURNS UUID AS $$
  SELECT company_id FROM public.profiles WHERE id = auth.uid()
$$ LANGUAGE sql SECURITY DEFINER SET search_path = public STABLE;

-- Eliminar la política recursiva de la migration 004.
DROP POLICY IF EXISTS "company_admin_view_own_company" ON public.profiles;

DROP POLICY IF EXISTS "profiles_select_own" ON public.profiles;
CREATE POLICY "profiles_select_own"
  ON public.profiles FOR SELECT
  TO authenticated
  USING (
    auth.uid() = id
    OR public.is_super_admin()
  );

-- update e insert ya eran correctas (solo auth.uid() = id), pero las
-- redefinimos por idempotencia y claridad.
DROP POLICY IF EXISTS "profiles_update_own" ON public.profiles;
CREATE POLICY "profiles_update_own"
  ON public.profiles FOR UPDATE
  TO authenticated
  USING (auth.uid() = id OR public.is_super_admin())
  WITH CHECK (auth.uid() = id OR public.is_super_admin());

DROP POLICY IF EXISTS "profiles_insert_own" ON public.profiles;
CREATE POLICY "profiles_insert_own"
  ON public.profiles FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = id);
