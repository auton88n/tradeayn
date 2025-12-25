-- Create grading_projects table for AI Grading Designer
CREATE TABLE public.grading_projects (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  project_name TEXT NOT NULL,
  description TEXT,
  survey_points JSONB NOT NULL DEFAULT '[]'::jsonb,
  terrain_analysis JSONB,
  requirements TEXT,
  design_result JSONB,
  cut_volume NUMERIC,
  fill_volume NUMERIC,
  net_volume NUMERIC,
  total_cost NUMERIC,
  status TEXT DEFAULT 'draft',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.grading_projects ENABLE ROW LEVEL SECURITY;

-- Create policies for user access
CREATE POLICY "Users can view their own grading projects" 
ON public.grading_projects 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own grading projects" 
ON public.grading_projects 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own grading projects" 
ON public.grading_projects 
FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own grading projects" 
ON public.grading_projects 
FOR DELETE 
USING (auth.uid() = user_id);

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_grading_projects_updated_at
BEFORE UPDATE ON public.grading_projects
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create index for faster queries
CREATE INDEX idx_grading_projects_user_id ON public.grading_projects(user_id);
CREATE INDEX idx_grading_projects_status ON public.grading_projects(status);