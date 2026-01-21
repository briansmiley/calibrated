-- Estimation Game Database Schema
-- Run this in your Supabase SQL Editor to set up a fresh database

-- Unit type enum
CREATE TYPE unit_type AS ENUM ('none', 'currency', 'percentage', 'custom');

-- Questions table
CREATE TABLE public.questions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  creator_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  slug text UNIQUE NOT NULL,
  title text NOT NULL,
  description text,
  true_answer numeric,
  unit_type unit_type DEFAULT 'none',
  custom_unit text,
  is_public boolean DEFAULT false,
  password text,
  min_value numeric,
  max_value numeric,
  guesses_revealed boolean DEFAULT false,
  revealed boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

-- Guesses table
CREATE TABLE public.guesses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  question_id uuid REFERENCES public.questions(id) ON DELETE CASCADE NOT NULL,
  user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  display_name text,
  value numeric NOT NULL,
  prior_visible_guesses integer,
  created_at timestamptz DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.guesses ENABLE ROW LEVEL SECURITY;

-- Questions policies

-- Anyone can view questions
CREATE POLICY "Questions are viewable by everyone"
  ON public.questions FOR SELECT
  USING (true);

-- Only authenticated users can create questions
CREATE POLICY "Authenticated users can create questions"
  ON public.questions FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = creator_id);

-- Only the creator can update their questions
CREATE POLICY "Users can update their own questions"
  ON public.questions FOR UPDATE
  TO authenticated
  USING (auth.uid() = creator_id)
  WITH CHECK (auth.uid() = creator_id);

-- Only the creator can delete their questions
CREATE POLICY "Users can delete their own questions"
  ON public.questions FOR DELETE
  TO authenticated
  USING (auth.uid() = creator_id);

-- Guesses policies

-- Anyone can view guesses (visibility controlled in UI, not RLS)
CREATE POLICY "Guesses are viewable by everyone"
  ON public.guesses FOR SELECT
  USING (true);

-- Anyone can submit guesses to unrevealed questions
CREATE POLICY "Anyone can submit guesses"
  ON public.guesses FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.questions q
      WHERE q.id = question_id
      AND q.revealed = false
    )
  );

-- Profiles table for user display names
CREATE TABLE public.profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  display_name text UNIQUE,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Anyone can view profiles
CREATE POLICY "Profiles are viewable by everyone"
  ON public.profiles FOR SELECT
  USING (true);

-- Users can insert their own profile
CREATE POLICY "Users can create their own profile"
  ON public.profiles FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = id);

-- Users can update their own profile
CREATE POLICY "Users can update their own profile"
  ON public.profiles FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- Function to automatically create profile on user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (id)
  VALUES (NEW.id);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to create profile when user signs up
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Indexes for performance
CREATE INDEX idx_questions_creator_id ON public.questions(creator_id);
CREATE INDEX idx_questions_slug ON public.questions(slug);
CREATE INDEX idx_questions_is_public ON public.questions(is_public) WHERE is_public = true;
CREATE INDEX idx_guesses_question_id ON public.guesses(question_id);
CREATE INDEX idx_guesses_user_id ON public.guesses(user_id);
CREATE INDEX idx_profiles_display_name ON public.profiles(display_name);
