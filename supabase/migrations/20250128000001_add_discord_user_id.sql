-- Add discord_user_id to simple_questions for creator authentication
ALTER TABLE simple_questions
ADD COLUMN discord_user_id TEXT;

-- Add comment explaining the column
COMMENT ON COLUMN simple_questions.discord_user_id IS 'Discord user ID of question creator, allows creator to reveal without PIN';
