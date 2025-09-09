-- Add foreign key constraint between mentor_profiles and profiles
ALTER TABLE mentor_profiles 
ADD CONSTRAINT mentor_profiles_user_id_fkey 
FOREIGN KEY (user_id) REFERENCES profiles(user_id) ON DELETE CASCADE;

-- Create an index for better performance
CREATE INDEX IF NOT EXISTS idx_mentor_profiles_user_id ON mentor_profiles(user_id);