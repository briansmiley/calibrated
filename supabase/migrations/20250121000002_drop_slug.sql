-- Drop slug column - using first 7 chars of UUID as short ID instead
ALTER TABLE public.questions DROP COLUMN IF EXISTS slug;

-- Drop the slug index if it exists
DROP INDEX IF EXISTS idx_questions_slug;
