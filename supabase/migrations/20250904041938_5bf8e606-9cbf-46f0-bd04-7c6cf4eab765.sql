-- Add admin role to the existing app_role enum if it doesn't exist
DO $$ BEGIN
    ALTER TYPE app_role ADD VALUE 'admin';
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Update the profiles table to make role not nullable and set a default
ALTER TABLE public.profiles 
ALTER COLUMN role SET NOT NULL,
ALTER COLUMN role SET DEFAULT 'mentee';

-- Update any existing profiles that have null role to 'mentee'
UPDATE public.profiles SET role = 'mentee' WHERE role IS NULL;

-- Create an index on role for better performance
CREATE INDEX IF NOT EXISTS idx_profiles_role ON public.profiles(role);

-- Update the trigger function to handle role properly with app_role enum
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
    COALESCE((NEW.raw_user_meta_data->>'role')::app_role, 'mentee'::app_role)
  );
  RETURN NEW;
END;
$$;