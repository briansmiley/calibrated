-- Make true_answer optional for simple_questions
-- Creators can leave the answer blank at creation time and supply it at reveal.
ALTER TABLE public.simple_questions
  ALTER COLUMN true_answer DROP NOT NULL;

-- Recreate the RPC function with nullable true_answer in its return type.
DROP FUNCTION IF EXISTS public.get_simple_question_by_prefix(text);

CREATE FUNCTION public.get_simple_question_by_prefix(prefix text)
RETURNS TABLE (
  id uuid,
  title text,
  description text,
  min_value double precision,
  max_value double precision,
  true_answer double precision,
  reveal_pin text,
  revealed_at timestamp with time zone,
  unit text,
  is_currency boolean,
  discord_user_id text,
  created_at timestamp with time zone
)
LANGUAGE sql
STABLE
AS $$
  SELECT
    id,
    title,
    description,
    min_value,
    max_value,
    true_answer,
    reveal_pin,
    revealed_at,
    unit,
    is_currency,
    discord_user_id,
    created_at
  FROM public.simple_questions
  WHERE id::text LIKE prefix || '%'
  LIMIT 2;
$$;
