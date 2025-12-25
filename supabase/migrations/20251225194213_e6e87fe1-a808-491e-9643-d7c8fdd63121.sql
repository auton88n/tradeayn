-- Create engineering_portfolio table for showcasing completed structural designs
CREATE TABLE public.engineering_portfolio (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  calculation_id UUID REFERENCES public.calculation_history(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  thumbnail_url TEXT,
  project_type TEXT NOT NULL,
  key_specs JSONB DEFAULT '{}'::jsonb,
  is_public BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.engineering_portfolio ENABLE ROW LEVEL SECURITY;

-- Create policies for portfolio access
CREATE POLICY "Users can view their own portfolio items"
ON public.engineering_portfolio
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own portfolio items"
ON public.engineering_portfolio
FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own portfolio items"
ON public.engineering_portfolio
FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own portfolio items"
ON public.engineering_portfolio
FOR DELETE
USING (auth.uid() = user_id);

CREATE POLICY "Anyone can view public portfolio items"
ON public.engineering_portfolio
FOR SELECT
USING (is_public = true);

CREATE POLICY "Admins can manage all portfolio items"
ON public.engineering_portfolio
FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role));

-- Create index for faster queries
CREATE INDEX idx_engineering_portfolio_user_id ON public.engineering_portfolio(user_id);
CREATE INDEX idx_engineering_portfolio_is_public ON public.engineering_portfolio(is_public) WHERE is_public = true;

-- Add trigger for updating updated_at
CREATE TRIGGER update_engineering_portfolio_updated_at
BEFORE UPDATE ON public.engineering_portfolio
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();