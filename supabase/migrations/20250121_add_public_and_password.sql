-- Add public visibility and password protection to questions

-- Add is_public flag (defaults to false for privacy)
ALTER TABLE public.questions ADD COLUMN IF NOT EXISTS is_public boolean DEFAULT false;

-- Add password field for optional protection
ALTER TABLE public.questions ADD COLUMN IF NOT EXISTS password text;

-- Index for efficient public feed queries
CREATE INDEX IF NOT EXISTS idx_questions_is_public ON public.questions(is_public) WHERE is_public = true;
