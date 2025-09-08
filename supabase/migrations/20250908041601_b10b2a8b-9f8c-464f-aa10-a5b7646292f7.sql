-- Enable email confirmations in auth settings
-- Note: This requires manual configuration in Supabase Dashboard
-- The following would be the equivalent if we could modify auth settings via SQL:

-- For now, we'll update our handle_new_user function to ensure proper profile creation
-- and set up email templates

-- First, let's check if we need to update the trigger function
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Insert profile for new user
  INSERT INTO public.profiles (user_id, email, full_name, role, onboarding_completed)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name', ''),
    COALESCE((NEW.raw_user_meta_data->>'role')::app_role, 'mentee'::app_role),
    -- Set onboarding as completed if user has a role, otherwise require onboarding
    CASE 
      WHEN NEW.raw_user_meta_data->>'role' IS NOT NULL THEN true
      ELSE false
    END
  );
  
  RETURN NEW;
END;
$$;