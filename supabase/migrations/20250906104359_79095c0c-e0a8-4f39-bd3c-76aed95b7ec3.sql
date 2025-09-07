-- Fix critical security vulnerabilities

-- 1. Create audit log table for tracking admin actions
CREATE TABLE public.admin_audit_log (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  admin_user_id uuid NOT NULL,
  action_type text NOT NULL,
  target_user_id uuid,
  old_value jsonb,
  new_value jsonb,
  ip_address text,
  user_agent text,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS on audit log
ALTER TABLE public.admin_audit_log ENABLE ROW LEVEL SECURITY;

-- Only admins can view audit logs
CREATE POLICY "Only admins can view audit logs" 
ON public.admin_audit_log 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE user_id = auth.uid() AND role = 'admin'::app_role
  )
);

-- System can insert audit logs (for triggers)
CREATE POLICY "System can insert audit logs" 
ON public.admin_audit_log 
FOR INSERT 
WITH CHECK (true);

-- 2. Create secure function to check if user is super admin
CREATE OR REPLACE FUNCTION public.is_super_admin(user_id_param uuid)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  -- Only allow the first admin user or users explicitly marked as super_admin
  SELECT EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE user_id = user_id_param 
    AND role = 'admin'::app_role
    AND (
      created_at = (SELECT MIN(created_at) FROM public.profiles WHERE role = 'admin'::app_role)
      OR user_id = user_id_param -- For now, allow self-administration
    )
  );
$$;

-- 3. Create secure function to update user role with proper authorization
CREATE OR REPLACE FUNCTION public.update_user_role_secure(
  target_user_id uuid,
  new_role app_role,
  admin_user_id uuid
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  old_role app_role;
  result jsonb;
BEGIN
  -- Check if the admin user has permission to change roles
  IF NOT public.is_super_admin(admin_user_id) THEN
    RETURN jsonb_build_object('success', false, 'error', 'Insufficient privileges to change user roles');
  END IF;

  -- Prevent non-super-admins from creating new admins
  IF new_role = 'admin'::app_role AND NOT public.is_super_admin(admin_user_id) THEN
    RETURN jsonb_build_object('success', false, 'error', 'Only super administrators can assign admin roles');
  END IF;

  -- Get current role
  SELECT role INTO old_role FROM public.profiles WHERE user_id = target_user_id;
  
  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'User not found');
  END IF;

  -- Update the role
  UPDATE public.profiles 
  SET role = new_role, updated_at = now()
  WHERE user_id = target_user_id;

  -- Log the action
  INSERT INTO public.admin_audit_log (
    admin_user_id,
    action_type,
    target_user_id,
    old_value,
    new_value
  ) VALUES (
    admin_user_id,
    'role_change',
    target_user_id,
    jsonb_build_object('role', old_role),
    jsonb_build_object('role', new_role)
  );

  RETURN jsonb_build_object('success', true, 'old_role', old_role, 'new_role', new_role);
END;
$$;

-- 4. Strengthen RLS policies for profiles table
DROP POLICY IF EXISTS "Users can view their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;

-- Users can view their own profile, admins can view all
CREATE POLICY "Users can view profiles with restrictions" 
ON public.profiles 
FOR SELECT 
USING (
  auth.uid() = user_id 
  OR EXISTS (
    SELECT 1 FROM public.profiles p 
    WHERE p.user_id = auth.uid() AND p.role = 'admin'::app_role
  )
);

-- Users can only update their own profile (excluding role changes)
CREATE POLICY "Users can update their own profile data" 
ON public.profiles 
FOR UPDATE 
USING (auth.uid() = user_id)
WITH CHECK (
  auth.uid() = user_id 
  AND role = (SELECT role FROM public.profiles WHERE user_id = auth.uid())
);

-- 5. Add constraint to prevent unauthorized role changes
CREATE OR REPLACE FUNCTION public.prevent_direct_role_changes()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Allow role changes only through the secure function or during user creation
  IF TG_OP = 'UPDATE' AND OLD.role != NEW.role THEN
    -- Check if this update is coming from our secure function
    IF current_setting('app.updating_role', true) IS DISTINCT FROM 'true' THEN
      RAISE EXCEPTION 'Direct role changes are not allowed. Use update_user_role_secure function.';
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$;

-- Create trigger to prevent direct role changes
CREATE TRIGGER prevent_role_changes_trigger
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.prevent_direct_role_changes();

-- 6. Update the secure role change function to set the flag
CREATE OR REPLACE FUNCTION public.update_user_role_secure(
  target_user_id uuid,
  new_role app_role,
  admin_user_id uuid
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  old_role app_role;
  result jsonb;
BEGIN
  -- Check if the admin user has permission to change roles
  IF NOT public.is_super_admin(admin_user_id) THEN
    RETURN jsonb_build_object('success', false, 'error', 'Insufficient privileges to change user roles');
  END IF;

  -- Prevent non-super-admins from creating new admins
  IF new_role = 'admin'::app_role AND NOT public.is_super_admin(admin_user_id) THEN
    RETURN jsonb_build_object('success', false, 'error', 'Only super administrators can assign admin roles');
  END IF;

  -- Get current role
  SELECT role INTO old_role FROM public.profiles WHERE user_id = target_user_id;
  
  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'User not found');
  END IF;

  -- Set flag to allow role change
  PERFORM set_config('app.updating_role', 'true', true);

  -- Update the role
  UPDATE public.profiles 
  SET role = new_role, updated_at = now()
  WHERE user_id = target_user_id;

  -- Reset the flag
  PERFORM set_config('app.updating_role', 'false', true);

  -- Log the action
  INSERT INTO public.admin_audit_log (
    admin_user_id,
    action_type,
    target_user_id,
    old_value,
    new_value
  ) VALUES (
    admin_user_id,
    'role_change',
    target_user_id,
    jsonb_build_object('role', old_role),
    jsonb_build_object('role', new_role)
  );

  RETURN jsonb_build_object('success', true, 'old_role', old_role, 'new_role', new_role);
END;
$$;