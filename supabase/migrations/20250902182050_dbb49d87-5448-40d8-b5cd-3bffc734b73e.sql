-- Security improvements for profiles table

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

-- Add comment to remind developers about email privacy
COMMENT ON COLUMN public.profiles.email IS 'SECURITY: Email addresses must NEVER be exposed to other users. Only display to profile owner.';

-- Create view for safe profile access (excludes email)
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

-- Enable RLS on the safe view
ALTER VIEW public.safe_profiles SET (security_barrier = true);

COMMENT ON VIEW public.safe_profiles IS 'Safe profile view that excludes email addresses - use this instead of direct profiles access when showing user info to others';