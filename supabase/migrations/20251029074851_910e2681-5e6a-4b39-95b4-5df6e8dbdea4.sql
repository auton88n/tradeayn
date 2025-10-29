-- Update handle_new_user function to remove Solana detection logic
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $function$
BEGIN
  -- Insert profile with only existing fields
  INSERT INTO public.profiles (user_id, company_name, contact_person)
  VALUES (
    NEW.id,
    NEW.raw_user_meta_data ->> 'company_name',
    NEW.raw_user_meta_data ->> 'full_name'
  );
  
  -- Assign default user role
  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, 'user');
  
  -- Create access grant entry (email authentication only)
  INSERT INTO public.access_grants (
    user_id, 
    is_active, 
    requires_approval,
    auth_method
  )
  VALUES (
    NEW.id, 
    false,
    true,
    'email'
  );
  
  RETURN NEW;
EXCEPTION WHEN OTHERS THEN
  -- Log the error but don't block user creation
  RAISE WARNING 'Error in handle_new_user: %', SQLERRM;
  RETURN NEW;
END;
$function$;