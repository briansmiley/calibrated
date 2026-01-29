-- Replace revealed boolean with revealed_at timestamp
ALTER TABLE simple_questions ADD COLUMN revealed_at TIMESTAMPTZ;

-- Migrate existing revealed questions (set to now so existing guesses aren't marked post-reveal)
UPDATE simple_questions SET revealed_at = now() WHERE revealed = true;

-- Drop the old boolean column
ALTER TABLE simple_questions DROP COLUMN revealed;
