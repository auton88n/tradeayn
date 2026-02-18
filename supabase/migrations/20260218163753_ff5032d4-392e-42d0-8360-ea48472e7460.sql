-- Part C: One-time fix to sync current balance with reality
-- TAO_USDT is OPEN with $5,000 deployed, so available balance = $10,000 - $5,000
UPDATE ayn_account_state
SET current_balance = 5000,
    updated_at = NOW()
WHERE id = '00000000-0000-0000-0000-000000000001'
  AND current_balance = 10000;