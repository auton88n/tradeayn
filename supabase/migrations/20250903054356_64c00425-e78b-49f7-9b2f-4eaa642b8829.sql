-- Only add the anonymous blocking policies for profiles table
CREATE POLICY "Block anonymous SELECT on profiles" 
ON public.profiles 
FOR SELECT 
TO anon 
USING (false);

CREATE POLICY "Block anonymous INSERT on profiles" 
ON public.profiles 
FOR INSERT 
TO anon 
WITH CHECK (false);

CREATE POLICY "Block anonymous UPDATE on profiles" 
ON public.profiles 
FOR UPDATE 
TO anon 
USING (false)
WITH CHECK (false);

CREATE POLICY "Block anonymous DELETE on profiles" 
ON public.profiles 
FOR DELETE 
TO anon 
USING (false);