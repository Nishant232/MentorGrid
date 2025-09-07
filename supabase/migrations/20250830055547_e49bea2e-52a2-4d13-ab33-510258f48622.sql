-- Create missing tables for mentor/mentee functionality

-- Mentor availability rules table
CREATE TABLE public.mentor_availability_rules (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  mentor_user_id uuid NOT NULL,
  weekday integer NOT NULL, -- 0-6 (Sunday-Saturday)
  start_minute integer NOT NULL, -- Minutes from midnight
  end_minute integer NOT NULL, -- Minutes from midnight
  timezone text NOT NULL DEFAULT 'UTC',
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.mentor_availability_rules ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Mentors can manage their own availability rules"
ON public.mentor_availability_rules
FOR ALL
USING (auth.uid() = mentor_user_id)
WITH CHECK (auth.uid() = mentor_user_id);

CREATE POLICY "Anyone can view active mentor availability rules"
ON public.mentor_availability_rules
FOR SELECT
USING (is_active = true);

-- Mentor availability exceptions table
CREATE TABLE public.mentor_availability_exceptions (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  mentor_user_id uuid NOT NULL,
  date date NOT NULL,
  start_minute integer, -- NULL for unavailable all day
  end_minute integer, -- NULL for unavailable all day
  is_available boolean NOT NULL DEFAULT false,
  notes text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.mentor_availability_exceptions ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Mentors can manage their own availability exceptions"
ON public.mentor_availability_exceptions
FOR ALL
USING (auth.uid() = mentor_user_id)
WITH CHECK (auth.uid() = mentor_user_id);

CREATE POLICY "Anyone can view mentor availability exceptions"
ON public.mentor_availability_exceptions
FOR SELECT
USING (true);

-- Calendar accounts table
CREATE TABLE public.calendar_accounts (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL,
  provider text NOT NULL, -- 'google' or 'microsoft'
  email text NOT NULL,
  access_token text,
  refresh_token text,
  sync_enabled boolean NOT NULL DEFAULT true,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE(user_id, provider, email)
);

-- Enable RLS
ALTER TABLE public.calendar_accounts ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can manage their own calendar accounts"
ON public.calendar_accounts
FOR ALL
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Bookings table
CREATE TABLE public.bookings (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  mentor_user_id uuid NOT NULL,
  mentee_user_id uuid NOT NULL,
  start_time timestamp with time zone NOT NULL,
  end_time timestamp with time zone NOT NULL,
  status text NOT NULL DEFAULT 'pending', -- pending, confirmed, completed, cancelled
  price_cents integer,
  currency text DEFAULT 'USD',
  notes text,
  meeting_url text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.bookings ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can view their own bookings"
ON public.bookings
FOR SELECT
USING (auth.uid() = mentor_user_id OR auth.uid() = mentee_user_id);

CREATE POLICY "Mentees can create bookings"
ON public.bookings
FOR INSERT
WITH CHECK (auth.uid() = mentee_user_id);

CREATE POLICY "Users can update their own bookings"
ON public.bookings
FOR UPDATE
USING (auth.uid() = mentor_user_id OR auth.uid() = mentee_user_id);

-- Session messages table
CREATE TABLE public.session_messages (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  booking_id uuid NOT NULL,
  sender_user_id uuid NOT NULL,
  message text NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.session_messages ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can view messages for their bookings"
ON public.session_messages
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.bookings 
    WHERE id = booking_id 
    AND (mentor_user_id = auth.uid() OR mentee_user_id = auth.uid())
  )
);

CREATE POLICY "Users can send messages for their bookings"
ON public.session_messages
FOR INSERT
WITH CHECK (
  auth.uid() = sender_user_id AND
  EXISTS (
    SELECT 1 FROM public.bookings 
    WHERE id = booking_id 
    AND (mentor_user_id = auth.uid() OR mentee_user_id = auth.uid())
  )
);

-- Reviews table
CREATE TABLE public.reviews (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  booking_id uuid NOT NULL,
  reviewer_user_id uuid NOT NULL,
  reviewee_user_id uuid NOT NULL,
  rating integer NOT NULL CHECK (rating >= 1 AND rating <= 5),
  feedback text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE(booking_id, reviewer_user_id)
);

-- Enable RLS
ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Anyone can view reviews"
ON public.reviews
FOR SELECT
USING (true);

CREATE POLICY "Users can create reviews for their completed bookings"
ON public.reviews
FOR INSERT
WITH CHECK (
  auth.uid() = reviewer_user_id AND
  EXISTS (
    SELECT 1 FROM public.bookings 
    WHERE id = booking_id 
    AND status = 'completed'
    AND (mentor_user_id = auth.uid() OR mentee_user_id = auth.uid())
  )
);

-- Categories table
CREATE TABLE public.categories (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name text NOT NULL UNIQUE,
  description text,
  mentor_count integer DEFAULT 0,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;

-- Create policy
CREATE POLICY "Anyone can view categories"
ON public.categories
FOR SELECT
USING (true);

-- Testimonials table
CREATE TABLE public.testimonials (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_name text NOT NULL,
  user_role text NOT NULL,
  content text NOT NULL,
  rating integer DEFAULT 5,
  avatar_url text,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.testimonials ENABLE ROW LEVEL SECURITY;

-- Create policy
CREATE POLICY "Anyone can view testimonials"
ON public.testimonials
FOR SELECT
USING (true);

-- Leaderboard table
CREATE TABLE public.leaderboard (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL UNIQUE,
  full_name text NOT NULL,
  avatar_url text,
  role text NOT NULL,
  xp integer DEFAULT 0,
  current_streak_days integer DEFAULT 0,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.leaderboard ENABLE ROW LEVEL SECURITY;

-- Create policy
CREATE POLICY "Anyone can view leaderboard"
ON public.leaderboard
FOR SELECT
USING (true);

-- Create triggers for updated_at columns
CREATE TRIGGER update_mentor_availability_rules_updated_at
  BEFORE UPDATE ON public.mentor_availability_rules
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_mentor_availability_exceptions_updated_at
  BEFORE UPDATE ON public.mentor_availability_exceptions
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_calendar_accounts_updated_at
  BEFORE UPDATE ON public.calendar_accounts
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_bookings_updated_at
  BEFORE UPDATE ON public.bookings
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_leaderboard_updated_at
  BEFORE UPDATE ON public.leaderboard
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Create a function for creating bookings
CREATE OR REPLACE FUNCTION public.create_booking(
  p_mentor_user_id uuid,
  p_mentee_user_id uuid,
  p_start timestamp with time zone,
  p_end timestamp with time zone,
  p_price_cents integer,
  p_currency text DEFAULT 'USD',
  p_notes text DEFAULT ''
) RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  booking_id uuid;
BEGIN
  INSERT INTO public.bookings (
    mentor_user_id,
    mentee_user_id,
    start_time,
    end_time,
    price_cents,
    currency,
    notes,
    meeting_url
  ) VALUES (
    p_mentor_user_id,
    p_mentee_user_id,
    p_start,
    p_end,
    p_price_cents,
    p_currency,
    p_notes,
    'https://meet.jit.si/' || gen_random_uuid()::text
  ) RETURNING id INTO booking_id;
  
  RETURN booking_id;
END;
$$;