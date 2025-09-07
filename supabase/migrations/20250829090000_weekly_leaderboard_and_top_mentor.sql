-- Weekly leaderboard and Top Mentor awarding

-- Helper: start of current ISO week (Monday)
CREATE OR REPLACE FUNCTION public.start_of_iso_week(ts timestamptz)
RETURNS date LANGUAGE sql IMMUTABLE AS $$
  SELECT (date_trunc('week', ts AT TIME ZONE 'UTC')::date)
$$;

-- Weekly leaderboard view using XP events within current week
CREATE OR REPLACE VIEW public.leaderboard_week AS
WITH weekly_xp AS (
  SELECT
    e.user_id,
    SUM(e.amount)::int AS week_xp
  FROM public.xp_events e
  WHERE e.created_at >= date_trunc('week', now())
    AND e.created_at < date_trunc('week', now()) + interval '7 days'
  GROUP BY e.user_id
)
SELECT
  p.user_id,
  p.full_name,
  p.avatar_url,
  p.role,
  wx.week_xp AS xp
FROM weekly_xp wx
JOIN public.profiles p ON p.user_id = wx.user_id
WHERE p.role IS NOT NULL;

ALTER VIEW public.leaderboard_week SET (security_invoker = on);
GRANT SELECT ON public.leaderboard_week TO authenticated;

-- Award Top Mentor to top N mentors by weekly XP
CREATE OR REPLACE FUNCTION public.award_top_mentors_for_week(p_week_start date, p_top_n int DEFAULT 10)
RETURNS void LANGUAGE plpgsql AS $$
DECLARE
  week_start timestamptz := p_week_start::timestamptz;
  week_end timestamptz := (p_week_start + 7)::timestamptz;
BEGIN
  -- Ensure achievement exists
  PERFORM 1 FROM public.achievements WHERE code = 'TOP_MENTOR';
  IF NOT FOUND THEN
    INSERT INTO public.achievements (code, name, description, icon)
    VALUES ('TOP_MENTOR', 'Top Mentor', 'Recognized among top mentors on the weekly leaderboard', 'trophy')
    ON CONFLICT (code) DO NOTHING;
  END IF;

  -- Award to top mentors this week
  WITH weekly AS (
    SELECT e.user_id, SUM(e.amount) AS xp
    FROM public.xp_events e
    WHERE e.created_at >= week_start AND e.created_at < week_end
    GROUP BY e.user_id
  ), ranked AS (
    SELECT w.user_id, w.xp,
           ROW_NUMBER() OVER (ORDER BY w.xp DESC NULLS LAST) AS rnk
    FROM weekly w
    JOIN public.profiles p ON p.user_id = w.user_id AND p.role = 'mentor'
  )
  INSERT INTO public.user_achievements (user_id, achievement_code)
  SELECT user_id, 'TOP_MENTOR' FROM ranked WHERE rnk <= p_top_n
  ON CONFLICT DO NOTHING;
END; $$;

-- Convenience wrapper for current week
CREATE OR REPLACE FUNCTION public.award_top_mentors_current_week(p_top_n int DEFAULT 10)
RETURNS void LANGUAGE plpgsql AS $$
BEGIN
  PERFORM public.award_top_mentors_for_week((date_trunc('week', now()))::date, p_top_n);
END; $$;


