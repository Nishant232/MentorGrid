-- Add token_expires_at column to calendar_accounts table
ALTER TABLE public.calendar_accounts 
ADD COLUMN IF NOT EXISTS token_expires_at TIMESTAMP WITH TIME ZONE;

-- Update the existing edge function to handle enhanced OAuth flow
-- This enables proper token storage and refresh handling