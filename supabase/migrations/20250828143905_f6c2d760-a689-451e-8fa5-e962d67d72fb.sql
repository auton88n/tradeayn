-- Create storage bucket for file attachments
INSERT INTO storage.buckets (id, name, public) VALUES ('attachments', 'attachments', false);

-- Create RLS policies for attachments bucket
CREATE POLICY "Users can view their own attachments" 
ON storage.objects 
FOR SELECT 
USING (auth.uid()::text = (storage.foldername(name))[1] AND bucket_id = 'attachments');

CREATE POLICY "Users can upload their own attachments" 
ON storage.objects 
FOR INSERT 
WITH CHECK (auth.uid()::text = (storage.foldername(name))[1] AND bucket_id = 'attachments');

CREATE POLICY "Users can update their own attachments" 
ON storage.objects 
FOR UPDATE 
USING (auth.uid()::text = (storage.foldername(name))[1] AND bucket_id = 'attachments');

CREATE POLICY "Users can delete their own attachments" 
ON storage.objects 
FOR DELETE 
USING (auth.uid()::text = (storage.foldername(name))[1] AND bucket_id = 'attachments');

-- Create messages table to store message with attachments
CREATE TABLE public.messages (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  content TEXT NOT NULL,
  attachment_url TEXT,
  attachment_name TEXT,
  attachment_type TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on messages table
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;

-- Create policies for messages table
CREATE POLICY "Users can view their own messages" 
ON public.messages 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own messages" 
ON public.messages 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own messages" 
ON public.messages 
FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own messages" 
ON public.messages 
FOR DELETE 
USING (auth.uid() = user_id);

-- Create trigger for automatic timestamp updates on messages
CREATE TRIGGER update_messages_updated_at
BEFORE UPDATE ON public.messages
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();