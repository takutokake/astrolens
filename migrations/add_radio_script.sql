-- Migration: Add radio_script column to digests table
-- Date: 2026-03-21
-- Description: Adds support for AI-generated radio-style narration scripts

-- Add radio_script column to digests table
ALTER TABLE digests ADD COLUMN IF NOT EXISTS radio_script TEXT;

-- Add index for faster queries (optional but recommended)
CREATE INDEX IF NOT EXISTS idx_digests_radio_script ON digests(radio_script) WHERE radio_script IS NOT NULL;

-- Verify the column was added
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'digests' AND column_name = 'radio_script';
