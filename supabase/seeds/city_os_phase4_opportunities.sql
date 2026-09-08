-- Phase 4 opportunity seed.
--
-- IMPORTANT, read before this reaches a resident.
--
-- Unlike every other seed in this repo, these are NOT invented. Provider names,
-- program names and URLs were taken from live web search on 2026-09-07. They
-- refer to real organisations offering real help.
--
-- That makes the accuracy bar much higher, and two limits apply:
--
--   1. NO URL HERE HAS BEEN FETCHED. The environment this was written in blocks
--      outbound web requests, so every link is unconfirmed. Each row carries
--      provenance.url_verified = false and the UI shows a "check with the
--      provider" notice off it. Someone must open all of these before a
--      resident in trouble is sent to one.
--   2. Eligibility is deliberately sparse. Only rules the source actually
--      stated are recorded. An invented income cut off could stop someone
--      applying for help they qualify for, which is worse than showing them one
--      programme too many, so absent facts are left absent and the matcher
--      treats them as "do not exclude".
--
-- Phone numbers and addresses are included only where the source gave them.
-- This is 22 opportunities, not the 40 the plan asks for: they are the ones the
-- searches actually surfaced with a named provider and a link. Padding to 40
-- would have meant inventing programmes, which is the one thing this file must
-- never do.

insert into public.opportunities
  (title, provider, category, description, url, phone, eligibility, life_events, provenance)
values
-- home repair -----------------------------------------------------------
('Home Rescue owner occupied rehabilitation', 'City of Toledo', 'home_repair',
 'Helps low and moderate income homeowners fix housing code violations.',
 'https://toledo.oh.gov/departments/housing-community-development/housing', null,
 '{"homeowner": true}', '{"bought_house"}',
 '{"source":"web_search","sourced_at":"2026-09-07","url_verified":false}'),

('Roof repair and replacement assistance', 'City of Toledo', 'home_repair',
 'Financial help and construction management for roof repair or replacement, for income eligible households in Toledo.',
 'https://toledo.oh.gov/residents/homeowners', null,
 '{"homeowner": true}', '{"bought_house"}',
 '{"source":"web_search","sourced_at":"2026-09-07","url_verified":false}'),

('Community Housing Impact and Preservation Program', 'Great Lakes Community Action Partnership', 'home_repair',
 'Repairs for eligible homeowners in Lucas County outside the City of Toledo. Can cover plumbing, electrical, roof, furnace, water heater, insulation and accessibility changes.',
 'https://www.glcap.org/programs/housing-assistance/community-resources/lucas-county-community-resources/',
 '419-334-8911', '{"homeowner": true}', '{"bought_house"}',
 '{"source":"web_search","sourced_at":"2026-09-07","url_verified":false,"note":"Source states this excludes the City of Toledo"}'),

('Home repairs', 'Maumee Valley Habitat for Humanity', 'home_repair',
 'Health and safety related home repairs for Lucas County residents. Source states applicants fall within 25 to 60 percent of area median income.',
 'https://www.findhelp.org/maumee-valley-habitat-for-humanity--maumee-oh--home-repairs/5162339317055488?postal=43601',
 '419-382-1964', '{"homeowner": true, "max_income_band": "30-60k"}', '{"bought_house"}',
 '{"source":"web_search","sourced_at":"2026-09-07","url_verified":false}'),

('Senior Brokering Program', 'Pathway, Inc.', 'senior',
 'For Lucas County residents aged 60 and over and people who are permanently disabled. Home visits, help with forms, home maintenance and appliances.',
 'https://areaofficeonaging.com/provider/4135', null,
 '{"senior": true}', '{"retired"}',
 '{"source":"web_search","sourced_at":"2026-09-07","url_verified":false}'),

-- utilities -------------------------------------------------------------
('Home Energy Assistance Program (HEAP)', 'Pathway, Inc.', 'utility',
 'A federally funded one time benefit applied to your home energy or bulk fuel bill. Covers Lucas County.',
 'https://www.findhelp.org/pathway,-inc.--toledo-oh--home-energy-assistance-program---utilities-assistance/6312749135298560?postal=43601',
 '419-865-3820', '{}', '{"lost_job","income_dropped"}',
 '{"source":"web_search","sourced_at":"2026-09-07","url_verified":false}'),

('Apply for energy help online', 'State of Ohio', 'utility',
 'The state portal for energy assistance applications.',
 'https://energyhelp.ohio.gov', null, '{}', '{"lost_job","income_dropped"}',
 '{"source":"web_search","sourced_at":"2026-09-07","url_verified":false}'),

('Summer Crisis Program', 'Pathway, Inc.', 'utility',
 'A one time summer benefit for cooling. Can cover electric bills, central air repair, a window unit or a fan. Source states it runs July 1 to September 30.',
 'https://pathwaytoledo.org/summer-crisis-program/', null,
 '{}', '{}',
 '{"source":"web_search","sourced_at":"2026-09-07","url_verified":false,"seasonal":"July 1 to September 30"}'),

('Utility provided assistance programs', 'Office of the Ohio Consumers Counsel', 'utility',
 'A guide to the payment plans and assistance each Ohio utility offers.',
 'https://www.occ.ohio.gov/factsheet/utility-provided-assistance-programs', null,
 '{}', '{"lost_job","income_dropped"}',
 '{"source":"web_search","sourced_at":"2026-09-07","url_verified":false}'),

('Help paying for utilities in Toledo', 'findhelp.org', 'utility',
 'A searchable directory of utility payment help in Toledo.',
 'https://www.findhelp.org/housing/help-pay-for-utilities--toledo-oh', null,
 '{}', '{"lost_job","income_dropped"}',
 '{"source":"web_search","sourced_at":"2026-09-07","url_verified":false}'),

-- food ------------------------------------------------------------------
('Emergency Choice Food Pantry', 'Lutheran Social Services of Northwestern Ohio', 'food',
 'Emergency food for families in need. Covers Lucas, Fulton, Ottawa and Wood counties.',
 'https://www.findhelp.org/food/emergency-food--toledo-oh', null,
 '{}', '{"lost_job","income_dropped"}',
 '{"source":"web_search","sourced_at":"2026-09-07","url_verified":false}'),

('Emergency food programs in Toledo', 'findhelp.org', 'food',
 'A searchable directory of food pantries and emergency food in Toledo.',
 'https://www.findhelp.org/food/emergency-food--toledo-oh', null,
 '{}', '{"lost_job","income_dropped"}',
 '{"source":"web_search","sourced_at":"2026-09-07","url_verified":false}'),

('Emergency assistance', 'The Salvation Army, Northwest Ohio', 'emergency',
 'Utility, rent, food, prescription, gas and lodging help for Lucas County residents, as funds allow.',
 'https://www.findhelp.org/emergency/emergency-payments--toledo-oh', null,
 '{}', '{"lost_job","income_dropped","eviction"}',
 '{"source":"web_search","sourced_at":"2026-09-07","url_verified":false}'),

-- veterans --------------------------------------------------------------
('Temporary Financial Assistance for veterans', 'Lucas County Veterans Service Commission', 'veteran',
 'For honourably discharged veterans living in Lucas County. Food vouchers, rent, mortgage and utility help, prescription funds, and transport to VA medical facilities.',
 'https://lucascountyvets.org/services/', '419-213-6090',
 '{"veteran": true}', '{"left_military","lost_job","income_dropped"}',
 '{"source":"web_search","sourced_at":"2026-09-07","url_verified":false,"address":"1301 Monroe St Suite 180, Toledo OH 43604"}'),

('Help filing a VA claim', 'Lucas County Veterans Service Commission', 'veteran',
 'Veterans Service Officers help Lucas County veterans and dependents file claims with the Veterans Administration.',
 'https://co.lucas.oh.us/958/Veterans-Service-Commission', '419-213-6090',
 '{"veteran": true}', '{"left_military"}',
 '{"source":"web_search","sourced_at":"2026-09-07","url_verified":false}'),

('Emergency food for veterans', 'Lucas County Veterans Service Commission with Toledo Seagate Foodbank', 'veteran',
 'Emergency food for Lucas County veterans and their families.',
 'https://lucascountyvets.org/services/', '419-213-6090',
 '{"veteran": true}', '{"lost_job","income_dropped"}',
 '{"source":"web_search","sourced_at":"2026-09-07","url_verified":false}'),

-- housing and buying ----------------------------------------------------
('Down payment assistance for first time buyers', 'City of Toledo', 'down_payment',
 'Help with a down payment for eligible first time buyers purchasing inside the city limits.',
 'https://toledo.oh.gov/departments/housing-community-development/housing', null,
 '{}', '{"bought_house","moved"}',
 '{"source":"web_search","sourced_at":"2026-09-07","url_verified":false}'),

('Your Choice! Down Payment Assistance', 'Ohio Housing Finance Agency', 'down_payment',
 'Assistance of 2.5 or 5 percent of the loan amount toward a down payment, closing costs or other pre closing expenses.',
 'https://myohiohome.org', null, '{}', '{"bought_house","moved"}',
 '{"source":"web_search","sourced_at":"2026-09-07","url_verified":false}'),

-- childcare and workforce ----------------------------------------------
('T.E.A.C.H. Early Childhood Ohio scholarship', 'T.E.A.C.H. Early Childhood Ohio', 'childcare',
 'Scholarships for childcare staff and directors studying early childhood education.',
 'https://occrra.org', null, '{}', '{"started_school","changed_career"}',
 '{"source":"web_search","sourced_at":"2026-09-07","url_verified":false}'),

('Ohio Incumbent Workforce Training Voucher Program', 'Ohio Department of Development', 'workforce',
 'Reimburses up to 50 percent of eligible employee training costs. Annual funding is limited.',
 'https://development.ohio.gov', null, '{"business_owner": true}', '{"started_business","changed_career"}',
 '{"source":"web_search","sourced_at":"2026-09-07","url_verified":false}'),

-- business --------------------------------------------------------------
('Vacant commercial space renovation grant', 'City of Toledo', 'business',
 'For property owners bringing vacant first floor commercial space up to code. Source states 75 percent of interior renovation costs reimbursed, up to 75,000 dollars.',
 'https://toledo.oh.gov', null, '{"business_owner": true}', '{"started_business"}',
 '{"source":"web_search","sourced_at":"2026-09-07","url_verified":false}'),

('Small business expansion loan', 'City of Toledo', 'business',
 'Loans up to 90,000 dollars for machinery, equipment and working capital. Source states businesses must have traded two years and commit to one full time job for every 35,000 dollars borrowed.',
 'https://toledo.oh.gov', null, '{"business_owner": true}', '{"started_business"}',
 '{"source":"web_search","sourced_at":"2026-09-07","url_verified":false}')
on conflict do nothing;
