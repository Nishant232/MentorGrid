-- Calendar & Availability schema

DO $$ BEGIN
  CREATE TYPE public.calendar_provider AS ENUM ('google', 'microsoft');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- Recurring weekly availability rules per mentor (times in mentor's timezone)
CREATE TABLE IF NOT EXISTS public.mentor_availability_rules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  mentor_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  weekday SMALLINT NOT NULL CHECK (weekday BETWEEN 0 AND 6), -- 0=Sunday ... 6=Saturday
  start_minute INT NOT NULL CHECK (start_minute BETWEEN 0 AND 1439),
  end_minute INT NOT NULL CHECK (end_minute BETWEEN 1 AND 1440 AND end_minute > start_minute),
  timezone TEXT NOT NULL, -- IANA tz like "America/New_York"
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- One-off availability exceptions (open or blocked windows on specific dates)
CREATE TABLE IF NOT EXISTS public.mentor_availability_exceptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  mentor_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  -- minute ranges in mentor's timezone for that date
  start_minute INT NOT NULL CHECK (start_minute BETWEEN 0 AND 1439),
  end_minute INT NOT NULL CHECK (end_minute BETWEEN 1 AND 1440 AND end_minute > start_minute),
  is_available BOOLEAN NOT NULL DEFAULT FALSE, -- false = block, true = open extra
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Connected external calendars
CREATE TABLE IF NOT EXISTS public.calendar_accounts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  provider calendar_provider NOT NULL,
  email TEXT NOT NULL,
  refresh_token TEXT, -- store securely; for demo purposes
  access_token TEXT,
  token_expires_at TIMESTAMPTZ,
  sync_enabled BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, provider, email)
);

-- Cached external busy events used to block booking windows
CREATE TABLE IF NOT EXISTS public.external_busy_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  provider calendar_provider NOT NULL,
  external_id TEXT NOT NULL,
  start_time TIMESTAMPTZ NOT NULL,
  end_time TIMESTAMPTZ NOT NULL,
  summary TEXT,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, provider, external_id)
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_availability_rules_mentor_weekday ON public.mentor_availability_rules (mentor_user_id, weekday);
CREATE INDEX IF NOT EXISTS idx_availability_exceptions_mentor_date ON public.mentor_availability_exceptions (mentor_user_id, date);
CREATE INDEX IF NOT EXISTS idx_external_busy_user_time ON public.external_busy_events (user_id, start_time, end_time);

-- RLS
ALTER TABLE public.mentor_availability_rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.mentor_availability_exceptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.calendar_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.external_busy_events ENABLE ROW LEVEL SECURITY;

-- Policies: users can manage their own availability and calendar accounts
CREATE POLICY IF NOT EXISTS "Mentor can manage own rules"
ON public.mentor_availability_rules FOR ALL
USING (auth.uid() = mentor_user_id)
WITH CHECK (auth.uid() = mentor_user_id);

CREATE POLICY IF NOT EXISTS "Mentor can manage own exceptions"
ON public.mentor_availability_exceptions FOR ALL
USING (auth.uid() = mentor_user_id)
WITH CHECK (auth.uid() = mentor_user_id);

CREATE POLICY IF NOT EXISTS "User can manage own calendar accounts"
ON public.calendar_accounts FOR ALL
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

CREATE POLICY IF NOT EXISTS "User can read own external busy"
ON public.external_busy_events FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY IF NOT EXISTS "System upserts external busy via service role only"
ON public.external_busy_events FOR INSERT TO service_role
WITH CHECK (true);

CREATE POLICY IF NOT EXISTS "System updates external busy via service role only"
ON public.external_busy_events FOR UPDATE TO service_role
USING (true)
WITH CHECK (true);

-- Triggers for updated_at
DO $$ BEGIN
  CREATE TRIGGER update_availability_rules_updated_at
  BEFORE UPDATE ON public.mentor_availability_rules
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TRIGGER update_calendar_accounts_updated_at
  BEFORE UPDATE ON public.calendar_accounts
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
EXCEPTION WHEN duplicate_object THEN NULL; END $$;


