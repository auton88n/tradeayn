-- Create helper function to check for admin OR duty role access
CREATE OR REPLACE FUNCTION public.has_duty_access(_user_id UUID)
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id 
    AND (role = 'admin' OR role = 'duty')
  )
$$;

-- Update service_applications policies for duty access
DROP POLICY IF EXISTS "Admins can view all applications" ON public.service_applications;
CREATE POLICY "Duty and admins can view all applications" 
ON public.service_applications 
FOR SELECT 
USING (has_duty_access(auth.uid()));

DROP POLICY IF EXISTS "Admins can update applications" ON public.service_applications;
CREATE POLICY "Duty and admins can update applications" 
ON public.service_applications 
FOR UPDATE 
USING (has_duty_access(auth.uid()));

DROP POLICY IF EXISTS "Admins can delete applications" ON public.service_applications;
CREATE POLICY "Duty and admins can delete applications" 
ON public.service_applications 
FOR DELETE 
USING (has_duty_access(auth.uid()));

-- Update application_replies policies for duty access
DROP POLICY IF EXISTS "Admins can view all application replies" ON public.application_replies;
CREATE POLICY "Duty and admins can view all application replies" 
ON public.application_replies 
FOR SELECT 
USING (has_duty_access(auth.uid()));

DROP POLICY IF EXISTS "Admins can insert application replies" ON public.application_replies;
CREATE POLICY "Duty and admins can insert application replies" 
ON public.application_replies 
FOR INSERT 
WITH CHECK (has_duty_access(auth.uid()));

DROP POLICY IF EXISTS "Admins can update application replies" ON public.application_replies;
CREATE POLICY "Duty and admins can update application replies" 
ON public.application_replies 
FOR UPDATE 
USING (has_duty_access(auth.uid()));

DROP POLICY IF EXISTS "Admins can delete application replies" ON public.application_replies;
CREATE POLICY "Duty and admins can delete application replies" 
ON public.application_replies 
FOR DELETE 
USING (has_duty_access(auth.uid()));

-- Update support_tickets policies for duty access
DROP POLICY IF EXISTS "Admins can view all tickets" ON public.support_tickets;
CREATE POLICY "Duty and admins can view all tickets" 
ON public.support_tickets 
FOR SELECT 
USING (has_duty_access(auth.uid()));

DROP POLICY IF EXISTS "Admins can update all tickets" ON public.support_tickets;
CREATE POLICY "Duty and admins can update all tickets" 
ON public.support_tickets 
FOR UPDATE 
USING (has_duty_access(auth.uid()));

DROP POLICY IF EXISTS "Admins can delete tickets" ON public.support_tickets;
CREATE POLICY "Duty and admins can delete tickets" 
ON public.support_tickets 
FOR DELETE 
USING (has_duty_access(auth.uid()));

-- Update ticket_messages policies for duty access
DROP POLICY IF EXISTS "Admins can view all messages" ON public.ticket_messages;
CREATE POLICY "Duty and admins can view all ticket messages" 
ON public.ticket_messages 
FOR SELECT 
USING (has_duty_access(auth.uid()));

DROP POLICY IF EXISTS "Admins can create messages" ON public.ticket_messages;
CREATE POLICY "Duty and admins can create ticket messages" 
ON public.ticket_messages 
FOR INSERT 
WITH CHECK (has_duty_access(auth.uid()));

DROP POLICY IF EXISTS "Admins can update messages" ON public.ticket_messages;
CREATE POLICY "Duty and admins can update ticket messages" 
ON public.ticket_messages 
FOR UPDATE 
USING (has_duty_access(auth.uid()));

DROP POLICY IF EXISTS "Admins can delete messages" ON public.ticket_messages;
CREATE POLICY "Duty and admins can delete ticket messages" 
ON public.ticket_messages 
FOR DELETE 
USING (has_duty_access(auth.uid()));

-- Update faq_items policies for duty access
DROP POLICY IF EXISTS "Admins can manage FAQs" ON public.faq_items;
CREATE POLICY "Duty and admins can manage FAQs" 
ON public.faq_items 
FOR ALL 
USING (has_duty_access(auth.uid()));

DROP POLICY IF EXISTS "Admins can view all FAQs" ON public.faq_items;
CREATE POLICY "Duty and admins can view all FAQs" 
ON public.faq_items 
FOR SELECT 
USING (has_duty_access(auth.uid()));