-- Add missing columns to profiles table for user suspension
ALTER TABLE public.profiles ADD COLUMN is_suspended BOOLEAN DEFAULT false;
ALTER TABLE public.profiles ADD COLUMN suspension_reason TEXT DEFAULT NULL;

-- Add missing fields to mentor_profiles table
ALTER TABLE public.mentor_profiles ADD COLUMN status TEXT DEFAULT 'active' CHECK (status IN ('pending', 'approved', 'rejected', 'active'));
ALTER TABLE public.mentor_profiles ADD COLUMN title TEXT DEFAULT '';
ALTER TABLE public.mentor_profiles ADD COLUMN rejection_reason TEXT DEFAULT NULL;

-- Create payments table for admin service
CREATE TABLE public.payments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  booking_id UUID NOT NULL REFERENCES public.bookings(id),
  mentee_id UUID NOT NULL,
  mentor_id UUID NOT NULL,
  amount_cents INTEGER NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'refunded')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  refunded_at TIMESTAMP WITH TIME ZONE DEFAULT NULL,
  refund_reason TEXT DEFAULT NULL
);

-- Enable RLS on payments
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for payments (admin only)
CREATE POLICY "Only admins can view payments" 
ON public.payments 
FOR SELECT 
USING (EXISTS (
  SELECT 1 FROM public.profiles 
  WHERE user_id = auth.uid() 
  AND role = 'admin'::app_role
));

CREATE POLICY "Only admins can manage payments" 
ON public.payments 
FOR ALL 
USING (EXISTS (
  SELECT 1 FROM public.profiles 
  WHERE user_id = auth.uid() 
  AND role = 'admin'::app_role
))
WITH CHECK (EXISTS (
  SELECT 1 FROM public.profiles 
  WHERE user_id = auth.uid() 
  AND role = 'admin'::app_role
));

-- Add trigger for updated_at on payments
CREATE TRIGGER update_payments_updated_at
BEFORE UPDATE ON public.payments
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();