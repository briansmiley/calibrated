-- Make min_value and max_value optional for simple_questions
ALTER TABLE public.simple_questions
  ALTER COLUMN min_value DROP NOT NULL,
  ALTER COLUMN max_value DROP NOT NULL;

-- Drop and recreate the RPC function (can't change return type with CREATE OR REPLACE)
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
