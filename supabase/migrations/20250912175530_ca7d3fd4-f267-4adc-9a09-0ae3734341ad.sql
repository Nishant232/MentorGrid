-- Fix security issue: Remove public access to mentor profiles and implement proper RLS
-- Drop the overly permissive policy that allows anyone to view mentor profiles
DROP POLICY IF EXISTS "Anyone can view active mentor profiles" ON public.mentor_profiles;

-- Create new secure policies for mentor profiles
-- Authenticated users can view active mentor profiles (for mentee search functionality)
CREATE POLICY "Authenticated users can view active mentor profiles" 
ON public.mentor_profiles 
FOR SELECT 
TO authenticated
USING (is_active = true);

-- Admins can view all mentor profiles
CREATE POLICY "Admins can view all mentor profiles" 
ON public.mentor_profiles 
FOR SELECT 
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE user_id = auth.uid() 
    AND role = 'admin'::app_role
  )
);

-- Also fix availability tables to require authentication
DROP POLICY IF EXISTS "Anyone can view active mentor availability rules" ON public.mentor_availability_rules;
DROP POLICY IF EXISTS "Anyone can view mentor availability exceptions" ON public.mentor_availability_exceptions;

-- Create secure policies for availability data
CREATE POLICY "Authenticated users can view active availability rules" 
ON public.mentor_availability_rules 
FOR SELECT 
TO authenticated
USING (is_active = true);

CREATE POLICY "Authenticated users can view availability exceptions" 
ON public.mentor_availability_exceptions 
FOR SELECT 
TO authenticated
USING (true);