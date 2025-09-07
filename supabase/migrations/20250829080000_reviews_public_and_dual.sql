-- Allow both participants to leave a review per booking and make reviews publicly viewable

-- Drop old unique constraint on booking_id if it exists, then add composite unique
DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM pg_constraint c
    JOIN pg_class t ON c.conrelid = t.oid
    WHERE t.relname = 'reviews' AND c.conname = 'reviews_booking_id_key'
  ) THEN
    ALTER TABLE public.reviews DROP CONSTRAINT reviews_booking_id_key;
  END IF;
EXCEPTION WHEN undefined_table THEN
  -- Table might not exist in some environments
  NULL;
END $$;

-- Ensure composite uniqueness (one review per reviewer per booking)
DO $$ BEGIN
  ALTER TABLE public.reviews ADD CONSTRAINT reviews_unique_per_participant UNIQUE (booking_id, reviewer_user_id);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- Helpful indexes for fetching mentor reviews
CREATE INDEX IF NOT EXISTS idx_reviews_reviewee ON public.reviews (reviewee_user_id, created_at DESC);

-- Relax RLS to permit public viewing of reviews while keeping insert restricted
DO $$ BEGIN
  DROP POLICY IF EXISTS "Participants can view reviews" ON public.reviews;
EXCEPTION WHEN undefined_table THEN NULL; END $$;

-- Anyone can view reviews
CREATE POLICY IF NOT EXISTS "Anyone can view reviews"
ON public.reviews FOR SELECT
USING (true);

-- Keep insert restricted to booking participants (policy created in earlier migration)

