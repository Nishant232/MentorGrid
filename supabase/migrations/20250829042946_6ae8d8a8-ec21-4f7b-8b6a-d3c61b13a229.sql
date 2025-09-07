-- Create enum for user roles
CREATE TYPE public.app_role AS ENUM ('mentor', 'mentee');

-- Create profiles table for basic user information
CREATE TABLE public.profiles (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
  email TEXT NOT NULL,
  full_name TEXT,
  avatar_url TEXT,
  role app_role,
  onboarding_completed BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create mentor profiles table
CREATE TABLE public.mentor_profiles (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
  skills TEXT[] DEFAULT '{}',
  expertise_areas TEXT[] DEFAULT '{}',
  hourly_rate DECIMAL(10,2),
  currency TEXT DEFAULT 'USD',
  availability JSONB DEFAULT '{}',
  bio TEXT,
  years_experience INTEGER,
  education TEXT,
  certifications TEXT[],
  languages TEXT[] DEFAULT '{"English"}',
  timezone TEXT,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create mentee profiles table
CREATE TABLE public.mentee_profiles (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
  interests TEXT[] DEFAULT '{}',
  goals TEXT[] DEFAULT '{}',
  current_level TEXT,
  learning_style TEXT,
  preferred_meeting_frequency TEXT,
  budget_range TEXT,
  bio TEXT,
  timezone TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.mentor_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.mentee_profiles ENABLE ROW LEVEL SECURITY;

-- Create policies for profiles
CREATE POLICY "Users can view their own profile" 
ON public.profiles 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own profile" 
ON public.profiles 
FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own profile" 
ON public.profiles 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

-- Create policies for mentor profiles
CREATE POLICY "Anyone can view active mentor profiles" 
ON public.mentor_profiles 
FOR SELECT 
USING (is_active = true);

CREATE POLICY "Mentors can update their own profile" 
ON public.mentor_profiles 
FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Mentors can insert their own profile" 
ON public.mentor_profiles 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

-- Create policies for mentee profiles
CREATE POLICY "Users can view their own mentee profile" 
ON public.mentee_profiles 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Mentees can update their own profile" 
ON public.mentee_profiles 
FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Mentees can insert their own profile" 
ON public.mentee_profiles 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

-- Create function to handle new user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (user_id, email, full_name)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name', '')
  );
  RETURN NEW;
END;
$$;

-- Create trigger for new user creation
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Create function to update timestamps
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for automatic timestamp updates
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_mentor_profiles_updated_at
  BEFORE UPDATE ON public.mentor_profiles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_mentee_profiles_updated_at
  BEFORE UPDATE ON public.mentee_profiles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();