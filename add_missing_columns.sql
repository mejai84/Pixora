-- ADD MISSING COLUMNS TO PROFIT_RECORDS
-- Run this in the Supabase SQL Editor to fix the schema cache error.

ALTER TABLE profit_records 
ADD COLUMN IF NOT EXISTS tiktok_spend FLOAT DEFAULT 0;

ALTER TABLE profit_records 
ADD COLUMN IF NOT EXISTS other_spend FLOAT DEFAULT 0;
