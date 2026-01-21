-- Combined migration for all pending features
-- Run this on production Supabase before merging feature branches

-- ============================================
-- Feature 1: Min/Max bounds for guesses
-- ============================================
ALTER TABLE public.questions ADD COLUMN IF NOT EXISTS min_value numeric;
ALTER TABLE public.questions ADD COLUMN IF NOT EXISTS max_value numeric;

-- ============================================
-- Feature 3: Public feed + password protection
-- ============================================
ALTER TABLE public.questions ADD COLUMN IF NOT EXISTS is_public boolean DEFAULT false;
ALTER TABLE public.questions ADD COLUMN IF NOT EXISTS password text;

-- Index for efficient public feed queries
CREATE INDEX IF NOT EXISTS idx_questions_is_public ON public.questions(is_public) WHERE is_public = true;
