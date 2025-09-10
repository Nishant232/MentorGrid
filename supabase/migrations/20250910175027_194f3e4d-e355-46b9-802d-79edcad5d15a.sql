-- Add storage bucket for mentor files (profile pictures and certificates)
INSERT INTO storage.buckets (id, name, public) VALUES ('mentor-files', 'mentor-files', true);

-- Create RLS policies for mentor file uploads
CREATE POLICY "Mentors can upload their own files" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'mentor-files' AND 
    auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "Anyone can view mentor profile pictures" ON storage.objects
  FOR SELECT USING (
    bucket_id = 'mentor-files' AND 
    (storage.foldername(name))[2] = 'profile-pictures'
  );

CREATE POLICY "Mentors can view their own certificates" ON storage.objects
  FOR SELECT USING (
    bucket_id = 'mentor-files' AND 
    auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "Mentors can update their own files" ON storage.objects
  FOR UPDATE USING (
    bucket_id = 'mentor-files' AND 
    auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "Mentors can delete their own files" ON storage.objects
  FOR DELETE USING (
    bucket_id = 'mentor-files' AND 
    auth.uid()::text = (storage.foldername(name))[1]
  );

-- Add new fields to mentor_profiles table
ALTER TABLE mentor_profiles 
ADD COLUMN profile_picture_url TEXT,
ADD COLUMN detailed_bio TEXT,
ADD COLUMN work_experience JSONB DEFAULT '[]'::jsonb,
ADD COLUMN certificates JSONB DEFAULT '[]'::jsonb,
ADD COLUMN recent_job_roles JSONB DEFAULT '[]'::jsonb,
ADD COLUMN social_media_links JSONB DEFAULT '{}'::jsonb;

-- Update existing records to have default values for new fields
UPDATE mentor_profiles 
SET 
  work_experience = '[]'::jsonb,
  certificates = '[]'::jsonb,
  recent_job_roles = '[]'::jsonb,
  social_media_links = '{}'::jsonb
WHERE work_experience IS NULL;