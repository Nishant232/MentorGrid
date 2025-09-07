-- Bookings & Sessions schema

-- status enum for bookings
DO $$ BEGIN
  CREATE TYPE public.booking_status AS ENUM ('pending', 'confirmed', 'cancelled', 'completed', 'declined');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- bookings table
CREATE TABLE IF NOT EXISTS public.bookings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  mentor_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  mentee_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  start_time TIMESTAMPTZ NOT NULL,
  end_time TIMESTAMPTZ NOT NULL,
  duration_minutes INTEGER GENERATED ALWAYS AS ((extract(epoch from (end_time - start_time)) / 60)::int) STORED,
  price_cents INTEGER NOT NULL DEFAULT 0,
  currency TEXT NOT NULL DEFAULT 'USD',
  status booking_status NOT NULL DEFAULT 'pending',
  meeting_provider TEXT DEFAULT 'jitsi',
  meeting_room TEXT,
  meeting_url TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- messages within a session (simple text log)
CREATE TABLE IF NOT EXISTS public.session_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id UUID NOT NULL REFERENCES public.bookings(id) ON DELETE CASCADE,
  sender_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  message TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- post-session reviews
CREATE TABLE IF NOT EXISTS public.reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id UUID NOT NULL UNIQUE REFERENCES public.bookings(id) ON DELETE CASCADE,
  reviewer_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  reviewee_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  rating INTEGER NOT NULL CHECK (rating BETWEEN 1 AND 5),
  feedback TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- indexes
CREATE INDEX IF NOT EXISTS idx_bookings_mentor_time ON public.bookings (mentor_user_id, start_time);
CREATE INDEX IF NOT EXISTS idx_bookings_mentee_time ON public.bookings (mentee_user_id, start_time);
CREATE INDEX IF NOT EXISTS idx_session_messages_booking ON public.session_messages (booking_id, created_at);

-- RLS
ALTER TABLE public.bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.session_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;

-- Policies
-- Bookings: mentor or mentee can view
CREATE POLICY IF NOT EXISTS "Mentor or mentee can view booking"
ON public.bookings FOR SELECT
USING (auth.uid() = mentor_user_id OR auth.uid() = mentee_user_id);

-- Bookings: mentee can insert their own request
CREATE POLICY IF NOT EXISTS "Mentee can create booking"
ON public.bookings FOR INSERT
WITH CHECK (auth.uid() = mentee_user_id);

-- Bookings: mentor or mentee can update limited fields; full control via RPC could be added later
CREATE POLICY IF NOT EXISTS "Participants can update booking"
ON public.bookings FOR UPDATE
USING (auth.uid() = mentor_user_id OR auth.uid() = mentee_user_id)
WITH CHECK (auth.uid() = mentor_user_id OR auth.uid() = mentee_user_id);

-- Messages: participants can view and insert
CREATE POLICY IF NOT EXISTS "Participants can view messages"
ON public.session_messages FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.bookings b
    WHERE b.id = booking_id AND (b.mentor_user_id = auth.uid() OR b.mentee_user_id = auth.uid())
  )
);

CREATE POLICY IF NOT EXISTS "Participants can insert messages"
ON public.session_messages FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.bookings b
    WHERE b.id = booking_id AND (b.mentor_user_id = auth.uid() OR b.mentee_user_id = auth.uid())
  ) AND sender_user_id = auth.uid()
);

-- Reviews: participants can insert once; both can view
CREATE POLICY IF NOT EXISTS "Participants can view reviews"
ON public.reviews FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.bookings b
    WHERE b.id = booking_id AND (b.mentor_user_id = auth.uid() OR b.mentee_user_id = auth.uid())
  )
);

CREATE POLICY IF NOT EXISTS "Participants can insert review"
ON public.reviews FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.bookings b
    WHERE b.id = booking_id AND (b.mentor_user_id = auth.uid() OR b.mentee_user_id = auth.uid())
  ) AND reviewer_user_id = auth.uid()
);

-- updated_at trigger for bookings
DO $$ BEGIN
  CREATE TRIGGER update_bookings_updated_at
  BEFORE UPDATE ON public.bookings
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
EXCEPTION WHEN duplicate_object THEN NULL; END $$;


