-- Fix mode name case mismatch to match Dashboard exactly
UPDATE ai_mode_configs SET mode_name = 'Nen Mode ⚡' WHERE mode_name = 'nen mode';
UPDATE ai_mode_configs SET mode_name = 'Research Pro' WHERE mode_name = 'Research pro';  
UPDATE ai_mode_configs SET mode_name = 'PDF Analyst' WHERE mode_name = 'PDF analyst';
UPDATE ai_mode_configs SET mode_name = 'Vision Lab' WHERE mode_name = 'Vision lab';