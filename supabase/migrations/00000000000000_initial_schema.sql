-- Initial database schema for Calibrated
-- Creates base tables before any feature migrations

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
  unit_type unit_type NOT NULL DEFAULT 'none',
  custom_unit text,
  guesses_revealed boolean NOT NULL DEFAULT false,
  revealed boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Guesses table
CREATE TABLE public.guesses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  question_id uuid REFERENCES public.questions(id) ON DELETE CASCADE NOT NULL,
  user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  display_name text,
  value numeric NOT NULL,
  prior_visible_guesses integer,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.guesses ENABLE ROW LEVEL SECURITY;

-- Questions policies
CREATE POLICY "Questions are viewable by everyone"
  ON public.questions FOR SELECT
  USING (true);

CREATE POLICY "Authenticated users can create questions"
  ON public.questions FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = creator_id);

CREATE POLICY "Users can update their own questions"
  ON public.questions FOR UPDATE
  TO authenticated
  USING (auth.uid() = creator_id)
  WITH CHECK (auth.uid() = creator_id);

CREATE POLICY "Users can delete their own questions"
  ON public.questions FOR DELETE
  TO authenticated
  USING (auth.uid() = creator_id);

-- Guesses policies
CREATE POLICY "Guesses are viewable by everyone"
  ON public.guesses FOR SELECT
  USING (true);

CREATE POLICY "Anyone can submit guesses"
  ON public.guesses FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.questions q
      WHERE q.id = question_id
      AND q.revealed = false
    )
  );

-- Indexes for performance
CREATE INDEX idx_questions_creator_id ON public.questions(creator_id);
CREATE INDEX idx_questions_slug ON public.questions(slug);
CREATE INDEX idx_guesses_question_id ON public.guesses(question_id);
CREATE INDEX idx_guesses_user_id ON public.guesses(user_id);
