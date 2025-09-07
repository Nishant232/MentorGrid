-- Remove problematic view and keep core security fixes
DROP VIEW IF EXISTS public.safe_profiles;

-- The core security fix has already been implemented in the code:
-- 1. Removed email field from booking queries in MentorBookings.tsx
-- 2. Added security comment to the email column
-- 3. Created safe profile function

-- The existing RLS policies on profiles table are already secure:
-- Users can only view their own profiles (auth.uid() = user_id)

-- Add final security comment
COMMENT ON TABLE public.profiles IS 'SECURITY: This table contains sensitive user data including emails. RLS policies ensure users can only access their own profile data.';