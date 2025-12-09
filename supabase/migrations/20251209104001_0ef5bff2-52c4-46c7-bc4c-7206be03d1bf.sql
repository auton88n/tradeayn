-- Allow anonymous users to insert into service_applications (public form submissions)
CREATE POLICY "Anyone can submit service applications"
ON public.service_applications
FOR INSERT
TO anon, authenticated
WITH CHECK (true);

-- Keep existing policies for authenticated users to view their own applications
-- and admins to manage all applications