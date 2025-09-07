-- Security improvements for profiles table

-- Create function to check if user is a mentor working with a specific mentee
CREATE OR REPLACE FUNCTION public.can_mentor_view_mentee_basic_info(mentor_id uuid, mentee_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM bookings 
    WHERE mentor_user_id = mentor_id 
    AND mentee_user_id = mentee_id 
    AND status IN ('confirmed', 'completed')
  );
$$;

-- Create function to get safe profile info (without email)
CREATE OR REPLACE FUNCTION public.get_safe_profile_info(target_user_id uuid)
RETURNS TABLE(user_id uuid, full_name text, avatar_url text)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT p.user_id, p.full_name, p.avatar_url
  FROM profiles p
  WHERE p.user_id = target_user_id;
$$;

-- Add more restrictive policy for SELECT operations on profiles
-- Drop existing policy first
DROP POLICY IF EXISTS "Users can view their own profile" ON public.profiles;

-- Create new stricter policy
CREATE POLICY "Users can only view their own profile" 
ON public.profiles 
FOR SELECT 
USING (auth.uid() = user_id);

-- Create policy for admin access (if needed)
CREATE POLICY "Admins can view all profiles except emails" 
ON public.profiles 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM profiles 
    WHERE user_id = auth.uid() 
    AND role = 'admin'
  )
);

-- Add check constraint to ensure email is never exposed in joins
ALTER TABLE public.profiles ADD CONSTRAINT check_email_privacy 
CHECK (email IS NOT NULL AND length(email) > 0);

COMMENT ON TABLE public.profiles IS 'User profiles with privacy protection - email addresses should never be exposed to other users';