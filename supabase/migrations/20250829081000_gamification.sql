-- Gamification: XP, streaks, badges, leaderboard

-- XP event types
DO $$ BEGIN
  CREATE TYPE public.xp_event AS ENUM (
    'signup',
    'complete_profile',
    'first_session',
    'session_completed',
    'review_given',
    'review_received',
    'streak_day'
  );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- User stats (both mentors and mentees)
CREATE TABLE IF NOT EXISTS public.user_stats (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  xp INTEGER NOT NULL DEFAULT 0,
  total_session_minutes INTEGER NOT NULL DEFAULT 0,
  total_sessions_completed INTEGER NOT NULL DEFAULT 0,
  current_streak_days INTEGER NOT NULL DEFAULT 0,
  longest_streak_days INTEGER NOT NULL DEFAULT 0,
  last_active_date DATE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Achievements catalog
CREATE TABLE IF NOT EXISTS public.achievements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code TEXT UNIQUE NOT NULL, -- e.g., FIRST_SESSION, TOP_MENTOR, STREAK_7, HOURS_100
  name TEXT NOT NULL,
  description TEXT,
  icon TEXT, -- optional name for UI icon
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- User achievements
CREATE TABLE IF NOT EXISTS public.user_achievements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  achievement_code TEXT NOT NULL REFERENCES public.achievements(code) ON DELETE CASCADE,
  unlocked_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, achievement_code)
);

-- XP ledger for transparency/debugging
CREATE TABLE IF NOT EXISTS public.xp_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  event_type xp_event NOT NULL,
  amount INTEGER NOT NULL,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- RLS
ALTER TABLE public.user_stats ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.achievements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_achievements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.xp_events ENABLE ROW LEVEL SECURITY;

-- Policies
-- Stats: users can view their own; allow a public leaderboard view (see view below)
CREATE POLICY IF NOT EXISTS "Users can view own stats"
ON public.user_stats FOR SELECT
USING (auth.uid() = user_id);

-- Allow service role to update stats
CREATE POLICY IF NOT EXISTS "Service can write stats"
ON public.user_stats FOR ALL TO service_role
USING (true) WITH CHECK (true);

-- Achievements catalog readable by all authenticated users
CREATE POLICY IF NOT EXISTS "Anyone can read achievements"
ON public.achievements FOR SELECT
USING (true);

-- Users can view their own achievements
CREATE POLICY IF NOT EXISTS "Users can read own user_achievements"
ON public.user_achievements FOR SELECT
USING (auth.uid() = user_id);

-- Service role can insert user_achievements
CREATE POLICY IF NOT EXISTS "Service can write user_achievements"
ON public.user_achievements FOR ALL TO service_role
USING (true) WITH CHECK (true);

-- Users can view their own xp_events
CREATE POLICY IF NOT EXISTS "Users can read own xp_events"
ON public.xp_events FOR SELECT
USING (auth.uid() = user_id);

-- Service role can write xp_events
CREATE POLICY IF NOT EXISTS "Service can write xp_events"
ON public.xp_events FOR ALL TO service_role
USING (true) WITH CHECK (true);

-- Timestamps trigger
DO $$ BEGIN
  CREATE TRIGGER update_user_stats_updated_at
  BEFORE UPDATE ON public.user_stats
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- Seed core achievements
INSERT INTO public.achievements (code, name, description, icon)
VALUES
  ('FIRST_SESSION', 'First Session', 'Completed your first mentoring session', 'award'),
  ('TOP_MENTOR', 'Top Mentor', 'Recognized among top mentors on the leaderboard', 'trophy'),
  ('STREAK_7', 'Consistency Streak', 'Maintained a 7-day activity streak', 'flame'),
  ('HOURS_100', '100+ Hours', 'Accumulated over 100 hours in sessions', 'timer')
ON CONFLICT (code) DO NOTHING;

-- Helper function: upsert user_stats row
CREATE OR REPLACE FUNCTION public.ensure_user_stats(p_user_id uuid)
RETURNS void LANGUAGE plpgsql AS $$
BEGIN
  INSERT INTO public.user_stats (user_id)
  VALUES (p_user_id)
  ON CONFLICT (user_id) DO NOTHING;
END; $$;

-- Award achievement if not already present
CREATE OR REPLACE FUNCTION public.award_achievement(p_user_id uuid, p_code text)
RETURNS void LANGUAGE plpgsql AS $$
BEGIN
  INSERT INTO public.user_achievements (user_id, achievement_code)
  SELECT p_user_id, p_code
  WHERE EXISTS (SELECT 1 FROM public.achievements a WHERE a.code = p_code)
  ON CONFLICT DO NOTHING;
END; $$;

-- Add XP and record event
CREATE OR REPLACE FUNCTION public.add_xp(p_user_id uuid, p_amount int, p_type xp_event, p_metadata jsonb DEFAULT '{}')
RETURNS void LANGUAGE plpgsql AS $$
DECLARE
  today date := (now() at time zone 'UTC')::date;
  new_streak int;
BEGIN
  PERFORM public.ensure_user_stats(p_user_id);
  INSERT INTO public.xp_events (user_id, amount, event_type, metadata)
  VALUES (p_user_id, p_amount, p_type, p_metadata);

  UPDATE public.user_stats s
  SET xp = s.xp + p_amount,
      -- streak logic: increment if last_active_date is yesterday or today; reset otherwise
      current_streak_days = (
        CASE
          WHEN s.last_active_date IS NULL THEN 1
          WHEN s.last_active_date = today THEN s.current_streak_days -- same day, keep
          WHEN s.last_active_date = today - 1 THEN s.current_streak_days + 1
          ELSE 1
        END
      ),
      longest_streak_days = GREATEST(
        CASE
          WHEN s.last_active_date IS NULL THEN 1
          WHEN s.last_active_date = today THEN s.current_streak_days
          WHEN s.last_active_date = today - 1 THEN s.current_streak_days + 1
          ELSE 1
        END,
        s.longest_streak_days
      ),
      last_active_date = today
  WHERE s.user_id = p_user_id;

  -- Award streak 7 achievement
  SELECT current_streak_days INTO new_streak FROM public.user_stats WHERE user_id = p_user_id;
  IF new_streak >= 7 THEN
    PERFORM public.award_achievement(p_user_id, 'STREAK_7');
  END IF;
END; $$;

-- Hook: when a booking is marked completed, update stats for both participants
CREATE OR REPLACE FUNCTION public.handle_booking_completed()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
DECLARE
  minutes int;
BEGIN
  IF NEW.status = 'completed' AND OLD.status IS DISTINCT FROM 'completed' THEN
    minutes := GREATEST(1, (extract(epoch FROM (NEW.end_time - NEW.start_time)) / 60)::int);

    -- mentor updates
    PERFORM public.ensure_user_stats(NEW.mentor_user_id);
    UPDATE public.user_stats
    SET total_session_minutes = total_session_minutes + minutes,
        total_sessions_completed = total_sessions_completed + 1
    WHERE user_id = NEW.mentor_user_id;
    PERFORM public.add_xp(NEW.mentor_user_id, 50, 'session_completed', jsonb_build_object('booking_id', NEW.id));

    -- mentee updates
    PERFORM public.ensure_user_stats(NEW.mentee_user_id);
    UPDATE public.user_stats
    SET total_session_minutes = total_session_minutes + minutes,
        total_sessions_completed = total_sessions_completed + 1
    WHERE user_id = NEW.mentee_user_id;
    PERFORM public.add_xp(NEW.mentee_user_id, 50, 'session_completed', jsonb_build_object('booking_id', NEW.id));

    -- First session achievement
    IF (SELECT total_sessions_completed FROM public.user_stats WHERE user_id = NEW.mentor_user_id) = 1 THEN
      PERFORM public.award_achievement(NEW.mentor_user_id, 'FIRST_SESSION');
    END IF;
    IF (SELECT total_sessions_completed FROM public.user_stats WHERE user_id = NEW.mentee_user_id) = 1 THEN
      PERFORM public.award_achievement(NEW.mentee_user_id, 'FIRST_SESSION');
    END IF;

    -- 100+ hours achievement
    IF (SELECT total_session_minutes FROM public.user_stats WHERE user_id = NEW.mentor_user_id) >= 6000 THEN
      PERFORM public.award_achievement(NEW.mentor_user_id, 'HOURS_100');
    END IF;
    IF (SELECT total_session_minutes FROM public.user_stats WHERE user_id = NEW.mentee_user_id) >= 6000 THEN
      PERFORM public.award_achievement(NEW.mentee_user_id, 'HOURS_100');
    END IF;
  END IF;
  RETURN NEW;
END; $$;

DO $$ BEGIN
  CREATE TRIGGER on_booking_completed
  AFTER UPDATE ON public.bookings
  FOR EACH ROW EXECUTE FUNCTION public.handle_booking_completed();
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- Leaderboard view (top by XP)
CREATE OR REPLACE VIEW public.leaderboard AS
SELECT
  p.user_id,
  p.full_name,
  p.avatar_url,
  p.role,
  s.xp,
  s.current_streak_days,
  s.longest_streak_days,
  s.total_session_minutes,
  s.total_sessions_completed
FROM public.profiles p
JOIN public.user_stats s ON s.user_id = p.user_id
WHERE p.role IS NOT NULL;

ALTER VIEW public.leaderboard SET (security_invoker = on);

-- RLS for view is derived; add explicit grant to authenticated
GRANT SELECT ON public.leaderboard TO authenticated;


