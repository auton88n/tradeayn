
-- Tighten error_logs INSERT: users can only insert errors tagged to themselves
DROP POLICY IF EXISTS "Authenticated users can insert errors" ON public.error_logs;

CREATE POLICY "Users can insert own errors"
  ON public.error_logs
  FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid() OR user_id IS NULL);
