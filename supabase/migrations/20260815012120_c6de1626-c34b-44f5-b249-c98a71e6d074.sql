
-- profiles: restrict reads to authenticated
DROP POLICY IF EXISTS "Users can view all profiles" ON public.profiles;
CREATE POLICY "Authenticated users can view profiles"
ON public.profiles FOR SELECT TO authenticated USING (true);

-- operators
DROP POLICY IF EXISTS "Anyone can view operators" ON public.operators;
CREATE POLICY "Authenticated users can view operators"
ON public.operators FOR SELECT TO authenticated USING (true);

-- nodes
DROP POLICY IF EXISTS "Anyone can view nodes" ON public.nodes;
CREATE POLICY "Authenticated users can view nodes"
ON public.nodes FOR SELECT TO authenticated USING (true);

-- checks: reads authenticated-only, inserts must own the operator
DROP POLICY IF EXISTS "Anyone can view checks" ON public.checks;
CREATE POLICY "Authenticated users can view checks"
ON public.checks FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "Authenticated users can create checks" ON public.checks;
CREATE POLICY "Users can create checks for own operators"
ON public.checks FOR INSERT TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.operators o
    WHERE o.id = checks.operator_id AND o.user_id = auth.uid()
  )
);

-- security definer helper functions should not be callable via the API
REVOKE ALL ON FUNCTION public.handle_new_user() FROM anon, authenticated, public;
REVOKE ALL ON FUNCTION public.update_updated_at() FROM anon, authenticated, public;

REVOKE SELECT ON public.profiles FROM anon;
REVOKE SELECT ON public.operators FROM anon;
REVOKE SELECT ON public.nodes FROM anon;
REVOKE SELECT ON public.checks FROM anon;
GRANT SELECT ON public.profiles TO authenticated;
GRANT SELECT ON public.operators TO authenticated;
GRANT SELECT ON public.nodes TO authenticated;
GRANT SELECT, INSERT ON public.checks TO authenticated;
