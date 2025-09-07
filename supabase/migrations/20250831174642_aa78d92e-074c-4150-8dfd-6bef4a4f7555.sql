-- Update reviews table to match component expectations
ALTER TABLE reviews 
ADD COLUMN IF NOT EXISTS comment text,
ADD COLUMN IF NOT EXISTS tags text[] DEFAULT '{}',
ADD COLUMN IF NOT EXISTS is_public boolean DEFAULT true,
ADD COLUMN IF NOT EXISTS type text DEFAULT 'mentor' CHECK (type IN ('mentor', 'mentee')),
ADD COLUMN IF NOT EXISTS status text DEFAULT 'approved' CHECK (status IN ('pending', 'approved', 'rejected'));

-- Update reviews table to use comment instead of feedback
UPDATE reviews SET comment = feedback WHERE comment IS NULL AND feedback IS NOT NULL;

-- Create external_busy_events table for calendar integration
CREATE TABLE IF NOT EXISTS external_busy_events (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  calendar_account_id uuid NOT NULL REFERENCES calendar_accounts(id) ON DELETE CASCADE,
  external_id text NOT NULL,
  start_time timestamp with time zone NOT NULL,
  end_time timestamp with time zone NOT NULL,
  title text NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS on external_busy_events
ALTER TABLE external_busy_events ENABLE ROW LEVEL SECURITY;

-- Create policies for external_busy_events
CREATE POLICY "Users can view their own calendar events" 
ON external_busy_events 
FOR SELECT 
USING (EXISTS (
  SELECT 1 FROM calendar_accounts 
  WHERE calendar_accounts.id = external_busy_events.calendar_account_id 
  AND calendar_accounts.user_id = auth.uid()
));

CREATE POLICY "Users can manage their own calendar events" 
ON external_busy_events 
FOR ALL 
USING (EXISTS (
  SELECT 1 FROM calendar_accounts 
  WHERE calendar_accounts.id = external_busy_events.calendar_account_id 
  AND calendar_accounts.user_id = auth.uid()
)) 
WITH CHECK (EXISTS (
  SELECT 1 FROM calendar_accounts 
  WHERE calendar_accounts.id = external_busy_events.calendar_account_id 
  AND calendar_accounts.user_id = auth.uid()
));

-- Add feedback tracking columns to bookings table
ALTER TABLE bookings 
ADD COLUMN IF NOT EXISTS mentor_feedback_submitted boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS mentee_feedback_submitted boolean DEFAULT false;

-- Add role column to profiles if it doesn't exist with proper type
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'role') THEN
    ALTER TABLE profiles ADD COLUMN role text CHECK (role IN ('mentor', 'mentee', 'admin'));
  END IF;
END $$;

-- Update trigger for external_busy_events
CREATE TRIGGER update_external_busy_events_updated_at
  BEFORE UPDATE ON external_busy_events
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();