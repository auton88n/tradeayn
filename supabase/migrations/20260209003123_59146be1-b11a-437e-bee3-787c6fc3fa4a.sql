
-- Create drawing_projects table for architectural drawing generation
CREATE TABLE public.drawing_projects (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  project_name TEXT,
  layout_json JSONB,
  style_preset TEXT,
  custom_description TEXT,
  num_bedrooms INTEGER,
  num_bathrooms INTEGER,
  target_sqft INTEGER,
  num_storeys INTEGER DEFAULT 1,
  has_garage BOOLEAN DEFAULT FALSE,
  garage_type TEXT,
  location_country TEXT,
  location_state_province TEXT,
  exterior_materials TEXT[],
  conversation_history JSONB DEFAULT '[]'::jsonb,
  compliance_project_id UUID REFERENCES public.compliance_projects(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.drawing_projects ENABLE ROW LEVEL SECURITY;

-- RLS policies
CREATE POLICY "Users can view their own drawing projects"
  ON public.drawing_projects FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own drawing projects"
  ON public.drawing_projects FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own drawing projects"
  ON public.drawing_projects FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own drawing projects"
  ON public.drawing_projects FOR DELETE
  USING (auth.uid() = user_id);

-- Trigger for updated_at
CREATE TRIGGER update_drawing_projects_updated_at
  BEFORE UPDATE ON public.drawing_projects
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Index for user lookups
CREATE INDEX idx_drawing_projects_user_id ON public.drawing_projects(user_id);
