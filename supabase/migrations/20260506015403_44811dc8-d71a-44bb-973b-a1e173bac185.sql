
CREATE TABLE public.generated_projects (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  name text NOT NULL,
  description text,
  prompt text,
  stack text,
  files jsonb NOT NULL DEFAULT '[]'::jsonb,
  env_vars jsonb NOT NULL DEFAULT '[]'::jsonb,
  database_schema jsonb,
  repo_full_name text,
  pr_url text,
  task_id uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.generated_projects ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users view own projects" ON public.generated_projects FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users insert own projects" ON public.generated_projects FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users update own projects" ON public.generated_projects FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users delete own projects" ON public.generated_projects FOR DELETE USING (auth.uid() = user_id);
CREATE TRIGGER trg_generated_projects_updated BEFORE UPDATE ON public.generated_projects FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

CREATE TABLE public.project_envs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid NOT NULL REFERENCES public.generated_projects(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  key text NOT NULL,
  value text NOT NULL DEFAULT '',
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(project_id, key)
);
ALTER TABLE public.project_envs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users view own envs" ON public.project_envs FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users insert own envs" ON public.project_envs FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users update own envs" ON public.project_envs FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users delete own envs" ON public.project_envs FOR DELETE USING (auth.uid() = user_id);

ALTER TABLE public.tasks ADD COLUMN IF NOT EXISTS kind text NOT NULL DEFAULT 'prompt';
ALTER TABLE public.tasks ADD COLUMN IF NOT EXISTS project_id uuid;
