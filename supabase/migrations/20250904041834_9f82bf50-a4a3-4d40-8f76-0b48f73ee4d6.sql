-- First, let's create the user_role enum if it doesn't exist
DO $$ BEGIN
    CREATE TYPE user_role AS ENUM ('mentor', 'mentee', 'admin');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Update the profiles table to make role not nullable and set a default
ALTER TABLE public.profiles 
ALTER COLUMN role TYPE user_role USING role::user_role,
ALTER COLUMN role SET NOT NULL,
ALTER COLUMN role SET DEFAULT 'mentee';

-- Update any existing profiles that have null role to 'mentee'
UPDATE public.profiles SET role = 'mentee' WHERE role IS NULL;

-- Create an index on role for better performance
CREATE INDEX IF NOT EXISTS idx_profiles_role ON public.profiles(role);

-- Update the trigger function to handle role properly
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (user_id, email, full_name, role)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name', ''),
    COALESCE((NEW.raw_user_meta_data->>'role')::user_role, 'mentee'::user_role)
  );
  RETURN NEW;
END;
$$;