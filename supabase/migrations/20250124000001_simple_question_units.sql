-- Add unit fields to simple_questions
ALTER TABLE simple_questions
ADD COLUMN unit text,
ADD COLUMN is_currency boolean DEFAULT false;
