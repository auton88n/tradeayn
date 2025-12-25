-- Create engineering_projects table
CREATE TABLE public.engineering_projects (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  project_name TEXT NOT NULL,
  project_type TEXT NOT NULL,
  inputs JSONB NOT NULL DEFAULT '{}'::jsonb,
  results JSONB DEFAULT '{}'::jsonb,
  status TEXT DEFAULT 'draft',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create calculation_history table
CREATE TABLE public.calculation_history (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id UUID REFERENCES public.engineering_projects(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  calculation_type TEXT NOT NULL,
  inputs JSONB NOT NULL DEFAULT '{}'::jsonb,
  outputs JSONB NOT NULL DEFAULT '{}'::jsonb,
  ai_analysis JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create material_prices table (Saudi market prices)
CREATE TABLE public.material_prices (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  material_name TEXT NOT NULL,
  material_category TEXT NOT NULL,
  unit TEXT NOT NULL,
  price_sar NUMERIC NOT NULL,
  supplier TEXT,
  region TEXT DEFAULT 'Riyadh',
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on all tables
ALTER TABLE public.engineering_projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.calculation_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.material_prices ENABLE ROW LEVEL SECURITY;

-- RLS policies for engineering_projects
CREATE POLICY "Users can view own projects" ON public.engineering_projects
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create own projects" ON public.engineering_projects
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own projects" ON public.engineering_projects
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own projects" ON public.engineering_projects
  FOR DELETE USING (auth.uid() = user_id);

CREATE POLICY "Admins can manage all projects" ON public.engineering_projects
  FOR ALL USING (has_role(auth.uid(), 'admin'::app_role));

-- RLS policies for calculation_history
CREATE POLICY "Users can view own calculations" ON public.calculation_history
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create own calculations" ON public.calculation_history
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins can view all calculations" ON public.calculation_history
  FOR SELECT USING (has_role(auth.uid(), 'admin'::app_role));

-- RLS policies for material_prices (public read, admin write)
CREATE POLICY "Anyone can view active material prices" ON public.material_prices
  FOR SELECT USING (is_active = true);

CREATE POLICY "Admins can manage material prices" ON public.material_prices
  FOR ALL USING (has_role(auth.uid(), 'admin'::app_role));

-- Insert default Saudi material prices
INSERT INTO public.material_prices (material_name, material_category, unit, price_sar, region) VALUES
  ('Concrete C25', 'Concrete', 'm³', 280, 'Riyadh'),
  ('Concrete C30', 'Concrete', 'm³', 310, 'Riyadh'),
  ('Concrete C35', 'Concrete', 'm³', 340, 'Riyadh'),
  ('Concrete C40', 'Concrete', 'm³', 380, 'Riyadh'),
  ('Steel Fy420 (10mm)', 'Reinforcement', 'ton', 2800, 'Riyadh'),
  ('Steel Fy420 (12mm)', 'Reinforcement', 'ton', 2750, 'Riyadh'),
  ('Steel Fy420 (16mm)', 'Reinforcement', 'ton', 2700, 'Riyadh'),
  ('Steel Fy420 (20mm)', 'Reinforcement', 'ton', 2650, 'Riyadh'),
  ('Steel Fy420 (25mm)', 'Reinforcement', 'ton', 2600, 'Riyadh'),
  ('Formwork (Plywood)', 'Formwork', 'm²', 85, 'Riyadh'),
  ('Formwork (Steel)', 'Formwork', 'm²', 120, 'Riyadh'),
  ('Labor - Concrete', 'Labor', 'm³', 45, 'Riyadh'),
  ('Labor - Steel Fixing', 'Labor', 'ton', 350, 'Riyadh'),
  ('Labor - Formwork', 'Labor', 'm²', 25, 'Riyadh');

-- Create updated_at trigger function if not exists
CREATE OR REPLACE FUNCTION public.handle_engineering_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Create triggers for updated_at
CREATE TRIGGER update_engineering_projects_updated_at
  BEFORE UPDATE ON public.engineering_projects
  FOR EACH ROW EXECUTE FUNCTION public.handle_engineering_updated_at();

CREATE TRIGGER update_material_prices_updated_at
  BEFORE UPDATE ON public.material_prices
  FOR EACH ROW EXECUTE FUNCTION public.handle_engineering_updated_at();