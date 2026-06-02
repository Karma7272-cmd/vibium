-- Pipelines (CI/CD)
CREATE TABLE public.pipelines (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL,
  name text NOT NULL,
  repo_full_name text,
  trigger text NOT NULL DEFAULT 'manual',
  steps jsonb NOT NULL DEFAULT '[]'::jsonb,
  env jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.pipelines TO authenticated;
GRANT ALL ON public.pipelines TO service_role;
ALTER TABLE public.pipelines ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users view own pipelines" ON public.pipelines FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users insert own pipelines" ON public.pipelines FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users update own pipelines" ON public.pipelines FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users delete own pipelines" ON public.pipelines FOR DELETE USING (auth.uid() = user_id);

CREATE TABLE public.pipeline_runs (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  pipeline_id uuid NOT NULL REFERENCES public.pipelines(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  status text NOT NULL DEFAULT 'queued',
  steps jsonb NOT NULL DEFAULT '[]'::jsonb,
  logs text NOT NULL DEFAULT '',
  started_at timestamptz,
  finished_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.pipeline_runs TO authenticated;
GRANT ALL ON public.pipeline_runs TO service_role;
ALTER TABLE public.pipeline_runs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users view own runs" ON public.pipeline_runs FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users insert own runs" ON public.pipeline_runs FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users update own runs" ON public.pipeline_runs FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users delete own runs" ON public.pipeline_runs FOR DELETE USING (auth.uid() = user_id);

CREATE INDEX idx_pipeline_runs_pipeline ON public.pipeline_runs(pipeline_id, created_at DESC);