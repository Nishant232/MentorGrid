-- Fix security issue: Remove public access to leaderboard containing personal data
-- Drop the overly permissive policy that allows anyone to view the leaderboard
DROP POLICY IF EXISTS "Anyone can view leaderboard" ON public.leaderboard;

-- Create new secure policy for leaderboard
-- Authenticated users can view the leaderboard (preserves gamification functionality)
CREATE POLICY "Authenticated users can view leaderboard" 
ON public.leaderboard 
FOR SELECT 
TO authenticated
USING (true);

-- Also fix the profiles table security issue mentioned in the scan
-- The current policy allows admin bypass which could expose data
DROP POLICY IF EXISTS "Users can view profiles with restrictions" ON public.profiles;

-- Create more secure profile viewing policy
-- Users can only view their own profile
CREATE POLICY "Users can view their own profile" 
ON public.profiles 
FOR SELECT 
TO authenticated
USING (auth.uid() = user_id);

-- Separate policy for admin access to profiles
CREATE POLICY "Admins can view all profiles" 
ON public.profiles 
FOR SELECT 
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.profiles p2
    WHERE p2.user_id = auth.uid() 
    AND p2.role = 'admin'::app_role
  )
);