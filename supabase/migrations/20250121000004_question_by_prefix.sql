-- Create function to find question by UUID prefix (short ID)
CREATE OR REPLACE FUNCTION public.get_question_by_prefix(prefix text)
RETURNS SETOF public.questions AS $$
BEGIN
  RETURN QUERY
  SELECT *
  FROM public.questions
  WHERE id::text LIKE prefix || '%'
  LIMIT 1;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant access to the function
GRANT EXECUTE ON FUNCTION public.get_question_by_prefix(text) TO anon;
GRANT EXECUTE ON FUNCTION public.get_question_by_prefix(text) TO authenticated;
