
CREATE TABLE public.founder_directives (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  directive text NOT NULL,
  category text DEFAULT 'general',
  priority integer DEFAULT 1,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  expires_at timestamptz
);

ALTER TABLE public.founder_directives ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage directives" ON public.founder_directives
  FOR ALL USING (
    EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role = 'admin')
  );

INSERT INTO public.founder_directives (directive, category, priority) VALUES
  ('Focus ONLY on Canadian companies. Do NOT suggest Dubai, Singapore, or any non-Canadian targets.', 'geo', 1),
  ('Target mid-size and small companies in Canada, especially Nova Scotia.', 'strategy', 1),
  ('Offer free trials of AYN engineering tools first. Get feedback before pushing paid services.', 'strategy', 1),
  ('Maximum 2 emails per lead to avoid spam.', 'outreach', 2);
