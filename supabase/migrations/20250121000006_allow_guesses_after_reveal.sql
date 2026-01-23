-- Allow guessing on simple questions even after revealed
DROP POLICY "Anyone can guess on unrevealed simple questions" ON public.simple_guesses;

CREATE POLICY "Anyone can guess on simple questions"
  ON public.simple_guesses FOR INSERT
  WITH CHECK (true);
