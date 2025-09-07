-- Functions: conflict-checked booking and mentor busy retrieval

-- Get mentor busy intervals (bookings + external busy) in [p_from, p_to)
CREATE OR REPLACE FUNCTION public.get_mentor_busy(
  p_mentor_user_id UUID,
  p_from TIMESTAMPTZ,
  p_to TIMESTAMPTZ
)
RETURNS TABLE (start_time TIMESTAMPTZ, end_time TIMESTAMPTZ, source TEXT)
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  (
    SELECT b.start_time, b.end_time, 'booking'::text AS source
    FROM public.bookings b
    WHERE b.mentor_user_id = p_mentor_user_id
      AND b.status IN ('pending','confirmed')
      AND b.end_time > p_from AND b.start_time < p_to
  )
  UNION ALL
  (
    SELECT e.start_time, e.end_time, 'external'::text AS source
    FROM public.external_busy_events e
    WHERE e.user_id = p_mentor_user_id
      AND e.end_time > p_from AND e.start_time < p_to
  );
$$;

REVOKE ALL ON FUNCTION public.get_mentor_busy(UUID, TIMESTAMPTZ, TIMESTAMPTZ) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_mentor_busy(UUID, TIMESTAMPTZ, TIMESTAMPTZ) TO authenticated;

-- Atomically create a booking if no conflicts with mentor busy events or existing mentee bookings
CREATE OR REPLACE FUNCTION public.create_booking_if_free(
  p_mentor_user_id UUID,
  p_mentee_user_id UUID,
  p_start TIMESTAMPTZ,
  p_end TIMESTAMPTZ,
  p_price_cents INT,
  p_currency TEXT,
  p_notes TEXT
)
RETURNS public.bookings
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_booking public.bookings;
BEGIN
  -- Basic guards
  IF p_end <= p_start THEN
    RAISE EXCEPTION 'end must be after start';
  END IF;

  -- Conflicts with mentor busy (bookings + external)
  IF EXISTS (
    SELECT 1 FROM public.get_mentor_busy(p_mentor_user_id, p_start, p_end) mb
  ) THEN
    RAISE EXCEPTION 'mentor not available in requested window';
  END IF;

  -- Conflicts with mentee own bookings
  IF EXISTS (
    SELECT 1 FROM public.bookings m
    WHERE m.mentee_user_id = p_mentee_user_id
      AND m.status IN ('pending','confirmed')
      AND m.end_time > p_start AND m.start_time < p_end
  ) THEN
    RAISE EXCEPTION 'mentee already has a session in requested window';
  END IF;

  INSERT INTO public.bookings (
    mentor_user_id, mentee_user_id, start_time, end_time,
    price_cents, currency, status, meeting_provider, notes
  ) VALUES (
    p_mentor_user_id, p_mentee_user_id, p_start, p_end,
    p_price_cents, COALESCE(p_currency, 'USD'), 'pending', 'jitsi', p_notes
  )
  RETURNING * INTO v_booking;

  RETURN v_booking;
END;
$$;

REVOKE ALL ON FUNCTION public.create_booking_if_free(UUID, UUID, TIMESTAMPTZ, TIMESTAMPTZ, INT, TEXT, TEXT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.create_booking_if_free(UUID, UUID, TIMESTAMPTZ, TIMESTAMPTZ, INT, TEXT, TEXT) TO authenticated;


