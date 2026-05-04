
-- Security scans
CREATE TABLE public.security_scans (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  url text NOT NULL,
  score integer,
  grade text,
  summary text,
  headers jsonb,
  ssl jsonb,
  findings jsonb,
  ai_analysis text,
  status text NOT NULL DEFAULT 'pending',
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.security_scans ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users view own scans" ON public.security_scans FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users insert own scans" ON public.security_scans FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users update own scans" ON public.security_scans FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users delete own scans" ON public.security_scans FOR DELETE USING (auth.uid() = user_id);

-- Analytics sites
CREATE TABLE public.analytics_sites (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  tracking_id text NOT NULL UNIQUE DEFAULT ('vbm_' || replace(gen_random_uuid()::text, '-', '')),
  name text NOT NULL,
  domain text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.analytics_sites ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users view own sites" ON public.analytics_sites FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users insert own sites" ON public.analytics_sites FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users update own sites" ON public.analytics_sites FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users delete own sites" ON public.analytics_sites FOR DELETE USING (auth.uid() = user_id);

-- Analytics events (public insert via edge function service role; SELECT only for owner)
CREATE TABLE public.analytics_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  site_id uuid NOT NULL REFERENCES public.analytics_sites(id) ON DELETE CASCADE,
  tracking_id text NOT NULL,
  event_type text NOT NULL DEFAULT 'pageview',
  path text,
  referrer text,
  user_agent text,
  country text,
  screen text,
  session_id text,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_events_site_created ON public.analytics_events(site_id, created_at DESC);
ALTER TABLE public.analytics_events ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Owners view own events" ON public.analytics_events FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.analytics_sites s WHERE s.id = analytics_events.site_id AND s.user_id = auth.uid())
);

-- Connector credentials
CREATE TABLE public.connector_credentials (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  connector_id text NOT NULL,
  api_key text NOT NULL,
  config jsonb DEFAULT '{}'::jsonb,
  status text NOT NULL DEFAULT 'connected',
  last_tested_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(user_id, connector_id)
);
ALTER TABLE public.connector_credentials ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users view own connectors" ON public.connector_credentials FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users insert own connectors" ON public.connector_credentials FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users update own connectors" ON public.connector_credentials FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users delete own connectors" ON public.connector_credentials FOR DELETE USING (auth.uid() = user_id);

CREATE TRIGGER update_connector_credentials_updated_at
BEFORE UPDATE ON public.connector_credentials
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();
