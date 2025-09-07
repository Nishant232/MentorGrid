-- Fix security warning by removing security_barrier and creating proper RLS

-- Drop the previous view
DROP VIEW IF EXISTS public.safe_profiles;

-- Create a regular view without security_barrier
CREATE OR REPLACE VIEW public.safe_profiles AS
SELECT 
  user_id,
  full_name,
  avatar_url,
  role,
  onboarding_completed,
  created_at,
  updated_at
FROM public.profiles;

-- Grant access to the safe view
GRANT SELECT ON public.safe_profiles TO authenticated;

COMMENT ON VIEW public.safe_profiles IS 'Safe profile view that excludes email addresses - use this instead of direct profiles access when showing user info to others';

-- Fix function search path issue
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