-- Create profiles table for user data
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  display_name TEXT,
  npub TEXT UNIQUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Profiles policies
CREATE POLICY "Users can view all profiles"
  ON public.profiles FOR SELECT
  USING (true);

CREATE POLICY "Users can update own profile"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile"
  ON public.profiles FOR INSERT
  WITH CHECK (auth.uid() = id);

-- Create operators table
CREATE TABLE public.operators (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  npub TEXT UNIQUE NOT NULL,
  name TEXT,
  bio TEXT,
  website TEXT,
  location TEXT,
  avatar_url TEXT,
  is_verified BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE public.operators ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view operators"
  ON public.operators FOR SELECT
  USING (true);

CREATE POLICY "Users can manage own operator"
  ON public.operators FOR ALL
  USING (auth.uid() = user_id);

-- Create nodes table
CREATE TABLE public.nodes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  operator_id UUID REFERENCES public.operators(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  location TEXT,
  status TEXT DEFAULT 'online' CHECK (status IN ('online', 'offline', 'maintenance')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE public.nodes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view nodes"
  ON public.nodes FOR SELECT
  USING (true);

CREATE POLICY "Operators can manage own nodes"
  ON public.nodes FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.operators
      WHERE operators.id = nodes.operator_id
      AND operators.user_id = auth.uid()
    )
  );

-- Create checks table
CREATE TABLE public.checks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  url TEXT NOT NULL,
  operator_id UUID REFERENCES public.operators(id) ON DELETE SET NULL,
  node_id UUID REFERENCES public.nodes(id) ON DELETE SET NULL,
  status TEXT NOT NULL CHECK (status IN ('success', 'failed', 'warning', 'running')),
  status_code INTEGER,
  duration INTEGER,
  screenshot_url TEXT,
  response_time INTEGER,
  error_message TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE public.checks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view checks"
  ON public.checks FOR SELECT
  USING (true);

CREATE POLICY "Authenticated users can create checks"
  ON public.checks FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Operators can manage own checks"
  ON public.checks FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.operators
      WHERE operators.id = checks.operator_id
      AND operators.user_id = auth.uid()
    )
  );

-- Create function to handle new user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, display_name)
  VALUES (
    new.id,
    COALESCE(new.raw_user_meta_data->>'display_name', split_part(new.email, '@', 1))
  );
  RETURN new;
END;
$$;

-- Trigger for new user creation
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- Update timestamp triggers
CREATE OR REPLACE FUNCTION public.update_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at();

CREATE TRIGGER update_operators_updated_at
  BEFORE UPDATE ON public.operators
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at();

CREATE TRIGGER update_nodes_updated_at
  BEFORE UPDATE ON public.nodes
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at();