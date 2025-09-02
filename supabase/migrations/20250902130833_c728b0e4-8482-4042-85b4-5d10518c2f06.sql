-- Add business context columns to profiles table
-- This allows AYN to store and remember business type and conversation context

ALTER TABLE public.profiles 
ADD COLUMN business_type text,
ADD COLUMN business_context text;