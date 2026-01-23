-- Add optional name field to simple_guesses
ALTER TABLE public.simple_guesses ADD COLUMN name text DEFAULT NULL;
