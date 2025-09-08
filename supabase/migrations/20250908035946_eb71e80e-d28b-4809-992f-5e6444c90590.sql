-- Drop existing problematic policies
DROP POLICY IF EXISTS "Users can update their own profile data" ON public.profiles;
DROP POLICY IF EXISTS "Users can view profiles with restrictions" ON public.profiles;

-- Create security definer function to get current user's role
CREATE OR REPLACE FUNCTION public.get_current_user_role()
RETURNS app_role AS $$
  SELECT role FROM public.profiles WHERE user_id = auth.uid();
$$ LANGUAGE SQL SECURITY DEFINER STABLE SET search_path = public;

-- Create security definer function to check if user is admin
CREATE OR REPLACE FUNCTION public.is_current_user_admin()
RETURNS boolean AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE user_id = auth.uid() 
    AND role = 'admin'::app_role
  );
$$ LANGUAGE SQL SECURITY DEFINER STABLE SET search_path = public;

-- Create corrected UPDATE policy without recursion
CREATE POLICY "Users can update their own profile data" 
ON public.profiles 
FOR UPDATE 
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Create corrected SELECT policy without recursion
CREATE POLICY "Users can view profiles with restrictions" 
ON public.profiles 
FOR SELECT 
USING (
  auth.uid() = user_id 
  OR public.is_current_user_admin()
);