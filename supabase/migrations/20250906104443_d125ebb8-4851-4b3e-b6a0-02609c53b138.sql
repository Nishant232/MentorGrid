-- Fix remaining security warnings

-- 1. Fix function search path issues by updating all existing functions
CREATE OR REPLACE FUNCTION public.get_safe_profile_info(target_user_id uuid)
 RETURNS TABLE(user_id uuid, full_name text, avatar_url text)
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path = 'public'
AS $$
  SELECT p.user_id, p.full_name, p.avatar_url
  FROM profiles p
  WHERE p.user_id = target_user_id;
$$;

CREATE OR REPLACE FUNCTION public.update_updated_at_column()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path = 'public'
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.handle_new_user()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path = 'public'
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

CREATE OR REPLACE FUNCTION public.create_booking(p_mentor_user_id uuid, p_mentee_user_id uuid, p_start timestamp with time zone, p_end timestamp with time zone, p_price_cents integer, p_currency text DEFAULT 'USD'::text, p_notes text DEFAULT ''::text)
 RETURNS uuid
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path = 'public'
AS $$
DECLARE
  booking_id uuid;
BEGIN
  INSERT INTO public.bookings (
    mentor_user_id,
    mentee_user_id,
    start_time,
    end_time,
    price_cents,
    currency,
    notes,
    meeting_url
  ) VALUES (
    p_mentor_user_id,
    p_mentee_user_id,
    p_start,
    p_end,
    p_price_cents,
    p_currency,
    p_notes,
    'https://meet.jit.si/' || gen_random_uuid()::text
  ) RETURNING id INTO booking_id;
  
  RETURN booking_id;
END;
$$;

-- Fix the search_path in our new functions too
CREATE OR REPLACE FUNCTION public.is_super_admin(user_id_param uuid)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = 'public'
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE user_id = user_id_param 
    AND role = 'admin'::app_role
    AND (
      created_at = (SELECT MIN(created_at) FROM public.profiles WHERE role = 'admin'::app_role)
      OR user_id = user_id_param
    )
  );
$$;

CREATE OR REPLACE FUNCTION public.prevent_direct_role_changes()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
BEGIN
  IF TG_OP = 'UPDATE' AND OLD.role != NEW.role THEN
    IF current_setting('app.updating_role', true) IS DISTINCT FROM 'true' THEN
      RAISE EXCEPTION 'Direct role changes are not allowed. Use update_user_role_secure function.';
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.update_user_role_secure(
  target_user_id uuid,
  new_role app_role,
  admin_user_id uuid
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
  old_role app_role;
  result jsonb;
BEGIN
  IF NOT public.is_super_admin(admin_user_id) THEN
    RETURN jsonb_build_object('success', false, 'error', 'Insufficient privileges to change user roles');
  END IF;

  IF new_role = 'admin'::app_role AND NOT public.is_super_admin(admin_user_id) THEN
    RETURN jsonb_build_object('success', false, 'error', 'Only super administrators can assign admin roles');
  END IF;

  SELECT role INTO old_role FROM public.profiles WHERE user_id = target_user_id;
  
  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'User not found');
  END IF;

  PERFORM set_config('app.updating_role', 'true', true);

  UPDATE public.profiles 
  SET role = new_role, updated_at = now()
  WHERE user_id = target_user_id;

  PERFORM set_config('app.updating_role', 'false', true);

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