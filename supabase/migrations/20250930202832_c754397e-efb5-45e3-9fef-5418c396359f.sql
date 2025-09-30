-- Add new columns to access_grants for Solana approval workflow
ALTER TABLE public.access_grants 
ADD COLUMN IF NOT EXISTS requires_approval boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS auth_method text DEFAULT 'email',
ADD COLUMN IF NOT EXISTS wallet_address text;

-- Add index for faster wallet address lookups
CREATE INDEX IF NOT EXISTS idx_access_grants_wallet_address ON public.access_grants(wallet_address);

-- Add index for auth method filtering
CREATE INDEX IF NOT EXISTS idx_access_grants_auth_method ON public.access_grants(auth_method);

-- Update handle_new_user function to detect Solana users
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
  is_solana_user boolean;
  user_wallet_address text;
BEGIN
  -- Check if this is a Solana user (email contains @solana.wallet)
  is_solana_user := NEW.email LIKE '%@solana.wallet';
  
  -- Get wallet address if Solana user
  IF is_solana_user THEN
    SELECT wallet_address INTO user_wallet_address
    FROM public.wallet_addresses
    WHERE user_id = NEW.id
    LIMIT 1;
  END IF;
  
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
  
  -- Create access grant entry with proper auth method and approval status
  INSERT INTO public.access_grants (
    user_id, 
    is_active, 
    requires_approval,
    auth_method,
    wallet_address
  )
  VALUES (
    NEW.id, 
    false,
    is_solana_user,
    CASE WHEN is_solana_user THEN 'solana' ELSE 'email' END,
    user_wallet_address
  );
  
  RETURN NEW;
EXCEPTION WHEN OTHERS THEN
  -- Log the error but don't block user creation
  RAISE WARNING 'Error in handle_new_user: %', SQLERRM;
  RETURN NEW;
END;
$$;