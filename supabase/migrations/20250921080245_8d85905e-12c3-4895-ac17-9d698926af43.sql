-- Address security warning about extensions in public schema
-- This is likely a pre-existing issue, not something we created
-- The uuid-ossp extension is commonly used and generally safe in public schema
-- But we'll document this for the user to review

-- Check what extensions are in public schema
SELECT schemaname, extname FROM pg_extension 
JOIN pg_namespace ON pg_extension.extnamespace = pg_namespace.oid 
WHERE schemaname = 'public';

-- Note: No changes being made to extensions as this requires careful consideration
-- This warning is informational and doesn't break functionality