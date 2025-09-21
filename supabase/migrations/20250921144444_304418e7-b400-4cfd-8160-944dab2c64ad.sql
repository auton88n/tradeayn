-- Create wallet_addresses table to link Solana wallets to user accounts
CREATE TABLE public.wallet_addresses (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  wallet_address TEXT NOT NULL UNIQUE,
  wallet_type TEXT NOT NULL DEFAULT 'solana',
  is_primary BOOLEAN DEFAULT true,
  verified BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.wallet_addresses ENABLE ROW LEVEL SECURITY;

-- Create policies for wallet addresses
CREATE POLICY "Users can view their own wallet addresses" 
ON public.wallet_addresses 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own wallet addresses" 
ON public.wallet_addresses 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own wallet addresses" 
ON public.wallet_addresses 
FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own wallet addresses" 
ON public.wallet_addresses 
FOR DELETE 
USING (auth.uid() = user_id);

-- Admins can manage all wallet addresses
CREATE POLICY "Admins can manage all wallet addresses" 
ON public.wallet_addresses 
FOR ALL 
USING (has_role(auth.uid(), 'admin'::app_role));

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_wallet_addresses_updated_at
BEFORE UPDATE ON public.wallet_addresses
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create function to handle Solana wallet authentication
CREATE OR REPLACE FUNCTION public.authenticate_or_create_solana_user(
  _wallet_address TEXT,
  _user_metadata JSONB DEFAULT '{}'::jsonb
) RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  existing_user_id UUID;
  new_user_id UUID;
BEGIN
  -- Check if wallet already exists
  SELECT user_id INTO existing_user_id
  FROM public.wallet_addresses
  WHERE wallet_address = _wallet_address
  LIMIT 1;
  
  IF existing_user_id IS NOT NULL THEN
    -- Update last seen
    UPDATE public.wallet_addresses 
    SET updated_at = now()
    WHERE wallet_address = _wallet_address;
    
    RETURN existing_user_id;
  END IF;
  
  -- Create new user account for the wallet
  -- Note: This would typically be handled by creating a user in auth.users
  -- For now, we'll return null to indicate the frontend should handle user creation
  
  RETURN NULL;
END;
$$;