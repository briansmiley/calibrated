-- Simple questions: stripped-down estimation game
-- No accounts, no ownership, just numbers and a number line

CREATE TABLE public.simple_questions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  description text DEFAULT NULL,
  min_value numeric NOT NULL,
  max_value numeric NOT NULL,
  true_answer numeric NOT NULL,
  reveal_pin text DEFAULT NULL,  -- null = anyone can reveal
  revealed boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE public.simple_guesses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  question_id uuid NOT NULL REFERENCES public.simple_questions(id) ON DELETE CASCADE,
  value numeric NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- Index for faster lookups
CREATE INDEX idx_simple_guesses_question_id ON public.simple_guesses(question_id);

-- RLS policies: completely open (no auth required)
ALTER TABLE public.simple_questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.simple_guesses ENABLE ROW LEVEL SECURITY;

-- Anyone can read questions
CREATE POLICY "Anyone can read simple questions"
  ON public.simple_questions FOR SELECT
  USING (true);

-- Anyone can create questions
CREATE POLICY "Anyone can create simple questions"
  ON public.simple_questions FOR INSERT
  WITH CHECK (true);

-- Anyone can update (for reveal)
CREATE POLICY "Anyone can update simple questions"
  ON public.simple_questions FOR UPDATE
  USING (true);

-- Anyone can read guesses
CREATE POLICY "Anyone can read simple guesses"
  ON public.simple_guesses FOR SELECT
  USING (true);

-- Anyone can create guesses (only on unrevealed questions)
CREATE POLICY "Anyone can guess on unrevealed simple questions"
  ON public.simple_guesses FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.simple_questions
      WHERE id = question_id AND revealed = false
    )
  );

-- Function to find simple question by UUID prefix
CREATE OR REPLACE FUNCTION public.get_simple_question_by_prefix(prefix text)
RETURNS SETOF public.simple_questions AS $$
BEGIN
  RETURN QUERY
  SELECT *
  FROM public.simple_questions
  WHERE id::text LIKE prefix || '%'
  LIMIT 1;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION public.get_simple_question_by_prefix(text) TO anon;
GRANT EXECUTE ON FUNCTION public.get_simple_question_by_prefix(text) TO authenticated;
