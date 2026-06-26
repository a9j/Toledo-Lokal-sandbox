-- DATA MIGRATION: Community account type reclassification
-- ========================================================
-- DO NOT APPLY THIS MIGRATION AUTOMATICALLY.
-- This file exists for reference and must be run manually
-- only after explicit owner approval of the classification report.
--
-- To apply: run each statement individually after confirming
-- the classification table with the project owner.
-- ========================================================

-- 1. Islamic Food Bank of Toledo -> nonprofit, approved
-- Reason: charitable food bank, primary category was Nonprofits & Community
UPDATE businesses
SET account_type = 'nonprofit',
    verification_status = 'approved'
WHERE id = 'c65adf1c-6546-4c0f-9885-5d9136952792'
  AND name = 'Islamic Food Bank of Toledo';

-- 2. Remove "Nonprofits & Community" secondary category tag from Plant House
-- Reason: for-profit retail shop, Shopping is the correct primary category
DELETE FROM business_categories
WHERE business_id = '10a92304-70c5-4088-b312-083e1283191a'
  AND category_id = (SELECT id FROM categories WHERE slug = 'nonprofits-community' LIMIT 1);

-- 3. Remove "Nonprofits & Community" secondary category tag from Jen's Frozen
-- Reason: for-profit food truck, Food & Drink is the correct primary category
DELETE FROM business_categories
WHERE business_id = '2a413fb3-9458-4d1e-9ed2-8d3827e4d0a4'
  AND category_id = (SELECT id FROM categories WHERE slug = 'nonprofits-community' LIMIT 1);

-- 4. Toledo Lokal stays as business (default). No action needed since
-- account_type defaults to 'business'. Just documenting the decision.
-- ID: a21b971a-2083-4eb6-8f26-82ff31df209b
