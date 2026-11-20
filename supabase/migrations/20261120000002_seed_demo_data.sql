-- ====================================================================
-- SEED DATA: Realistic Kanpur Real Estate Demo Data
-- (Can be executed or deleted safely anytime via Supabase SQL Editor)
-- ====================================================================

-- 1. Insert Initial Settings
insert into public.business_settings (
  company_name,
  city,
  working_hours_start,
  working_hours_end,
  working_days,
  ai_tone,
  ai_language
) values (
  'Kanpur Prime Realty',
  'Kanpur',
  '10:00',
  '18:00',
  array['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'],
  'Professional, warm, helpful and knowledgeable',
  'Hinglish'
)
on conflict do nothing;

-- 2. Insert Real Estate Properties in Kanpur
insert into public.properties (
  id,
  project_name,
  location,
  property_type,
  bhk,
  carpet_area,
  price_min,
  price_max,
  payment_plan,
  rera_number,
  brochure_url,
  status,
  description
) values
(
  'e1a0b380-6bc1-447a-8f55-14f7b6070001',
  'Ganga Heights Luxury Towers',
  'Civil Lines, Kanpur',
  'Apartment',
  '3 & 4 BHK',
  2150,
  14500000, -- 1.45 Cr
  22500000, -- 2.25 Cr
  '20:80 Construction Linked / Possession Linked Plan',
  'UPRERAPRJ882190',
  'https://example.com/brochures/ganga-heights.pdf',
  'available',
  'Ultra-luxury river-view 3 & 4 BHK residences located in Civil Lines, Kanpur. Features clubhouse, Olympic-size pool, EV charging stations, 24/7 3-tier security, and panoramic views of the Ganga riverfront.'
),
(
  'e1a0b380-6bc1-447a-8f55-14f7b6070002',
  'Emerald Park View Residences',
  'Swaroop Nagar, Kanpur',
  'Apartment',
  '3 BHK',
  1680,
  9800000, -- 98 Lakhs
  13500000, -- 1.35 Cr
  '10:90 Bank Subvention Plan available with SBI/HDFC',
  'UPRERAPRJ441209',
  'https://example.com/brochures/emerald-park.pdf',
  'available',
  'Prime residential location in Swaroop Nagar opposite Motijheel. Premium italian marble flooring, modular kitchen, dedicated basement parking, 100% power backup.'
),
(
  'e1a0b380-6bc1-447a-8f55-14f7b6070003',
  'Avadh Smart City Township Plots',
  'Kalyanpur (GT Road), Kanpur',
  'Plot',
  null,
  1800, -- 200 sq yards
  4500000, -- 45 Lakhs
  7500000, -- 75 Lakhs
  'Direct Registry, 50% downpayment, balance in 6 monthly EMIs',
  'UPRERAPRJ119832',
  'https://example.com/brochures/avadh-smart-city.pdf',
  'available',
  'KDA approved gated plotted development near IIT Kanpur, GT Road. 40-foot wide internal roads, underground electricity cabling, commercial complex, and landscaped central park.'
),
(
  'e1a0b380-6bc1-447a-8f55-14f7b6070004',
  'Kanpur Central Commercial Hub',
  'Mall Road / Parade, Kanpur',
  'Commercial',
  null,
  850,
  12000000, -- 1.2 Cr
  35000000, -- 3.5 Cr
  'Rental yield guarantee 8% per annum for first 3 years',
  'UPRERAPRJ992011',
  'https://example.com/brochures/central-commercial.pdf',
  'available',
  'High footfall retail showrooms and Grade-A corporate office suites in the commercial heart of Kanpur. Triple basement parking, central air conditioning, high speed elevators.'
),
(
  'e1a0b380-6bc1-447a-8f55-14f7b6070005',
  'Royal Greens Villa Enclave',
  'Shyam Nagar / GTB Nagar, Kanpur',
  'Villa',
  '4 BHK',
  2800,
  18500000, -- 1.85 Cr
  26000000, -- 2.6 Cr
  'Customized construction stage payment schedule',
  'UPRERAPRJ552101',
  'https://example.com/brochures/royal-greens.pdf',
  'sold_out',
  'Exclusive gated community of 4 BHK duplex luxury villas with private lawns, terrace garden, and home automation systems.'
)
on conflict (id) do nothing;

-- 3. Insert Realistic Leads
insert into public.leads (
  id,
  source,
  ig_handle,
  full_name,
  phone,
  email,
  intent,
  property_type,
  preferred_location,
  budget_min,
  budget_max,
  timeline,
  lead_score,
  status,
  consent_given,
  consent_at,
  ai_summary,
  notes,
  last_contact_at,
  next_followup_at
) values
(
  'c2b1a111-0001-4000-8000-000000000001',
  'instagram',
  'dr_alok_mishra',
  'Dr. Alok Mishra',
  '+919839012345',
  'alok.mishra.doc@gmail.com',
  'buy',
  'Apartment',
  'Civil Lines, Kanpur',
  15000000,
  20000000,
  '1-2 months',
  'hot',
  'site_visit_booked',
  true,
  now() - interval '2 days',
  'Senior Cardiologist at Regency Hospital. Interested in 4 BHK Ganga view apartment in Ganga Heights. Ready with 30% self-funding, seeking peaceful location with 2 car parking slots.',
  'Prefers site visit in afternoon after OPD hours (approx 3 PM).',
  now() - interval '1 day',
  now() + interval '1 day'
),
(
  'c2b1a111-0002-4000-8000-000000000002',
  'manual',
  null,
  'Vikramaditya Singhania',
  '+919838023456',
  'vikram.singhania@textiles.in',
  'invest',
  'Commercial',
  'Mall Road, Kanpur',
  10000000,
  30000000,
  'Immediate',
  'hot',
  'negotiation',
  true,
  now() - interval '5 days',
  'Textile exporter looking for Grade-A retail space or office suite with high rental yield on Mall Road. Has reviewed brochure and negotiated on 2nd floor 1200 sqft unit.',
  'Awaiting final floor layout and payment milestone schedule.',
  now() - interval '4 hours',
  now() + interval '2 hours'
),
(
  'c2b1a111-0003-4000-8000-000000000003',
  'form',
  null,
  'Pooja Gupta',
  '+919792034567',
  'poojagupta.knp@yahoo.com',
  'buy',
  'Apartment',
  'Swaroop Nagar, Kanpur',
  8000000,
  12000000,
  '3-6 months',
  'warm',
  'contacted',
  true,
  now() - interval '3 days',
  'Family moving from Kakadeo to Swaroop Nagar for school proximity. Looking for 3 BHK under 1.2 Cr in Emerald Park View. Bank loan pre-approved from HDFC.',
  'Sent brochure and virtual walk-through video via WhatsApp.',
  now() - interval '2 days',
  now() - interval '3 hours' -- overdue follow-up
),
(
  'c2b1a111-0004-4000-8000-000000000004',
  'import',
  'priya_tandon_art',
  'Priya Tandon',
  '+919415045678',
  'priya.tandon@outlook.com',
  'buy',
  'Plot',
  'Kalyanpur, Kanpur',
  4000000,
  6000000,
  'Browsing',
  'cold',
  'new',
  false,
  null,
  'Inquired about residential plots near IIT Kanpur. Budget around 50L. Not ready for site visit immediately, requested master plan on email.',
  'Lead imported from offline property expo.',
  now() - interval '4 days',
  now() + interval '2 days'
),
(
  'c2b1a111-0005-4000-8000-000000000005',
  'manual',
  null,
  'Ramesh Chandra Awasthi',
  '+919839956789',
  'rcawasthi.knp@gmail.com',
  'buy',
  'Villa',
  'Shyam Nagar, Kanpur',
  18000000,
  22000000,
  'Immediate',
  'hot',
  'won',
  true,
  now() - interval '14 days',
  'Retired CPWD chief engineer. Closed deal for 4 BHK Villa in Royal Greens Enclave. Booking amount token received.',
  'Deal closed. Handover documentation initiated.',
  now() - interval '1 day',
  null
)
on conflict (id) do nothing;

-- 4. Insert Messages for Dr. Alok Mishra
insert into public.messages (
  lead_id,
  direction,
  channel,
  sender,
  content,
  created_at
) values
(
  'c2b1a111-0001-4000-8000-000000000001',
  'in',
  'instagram',
  'lead',
  'Namaste! Civil Lines me Ganga river view apartments available hain kya? Price range kya hai?',
  now() - interval '2 days'
),
(
  'c2b1a111-0001-4000-8000-000000000001',
  'out',
  'instagram',
  'ai',
  'Namaste Dr. Alok! Kanpur Prime Realty ki taraf se swagat hai. Ji haan, Civil Lines me hamara flagship project Ganga Heights available hai jisme premium 3 & 4 BHK river-view residences hain. Price range ₹1.45 Cr se ₹2.25 Cr tak hai. Kya aap apne family ke liye dekh rahe hain ya investment ke liye?',
  now() - interval '2 days' + interval '2 minutes'
),
(
  'c2b1a111-0001-4000-8000-000000000001',
  'in',
  'instagram',
  'lead',
  'Khud ke rehne ke liye chahiye. 4 BHK prefer karunga with 2 car parking. Possession kab tak milegi?',
  now() - interval '2 days' + interval '10 minutes'
),
(
  'c2b1a111-0001-4000-8000-000000000001',
  'out',
  'instagram',
  'ai',
  'Bahut badhiya sir. Ganga Heights me 4 BHK 2150 sqft carpet area ke sath aata hai aur 2 dedicated covered parking spaces included hain. Possession December 2026 me planned hai (RERA: UPRERAPRJ882190). Kya hamari team aapko sample flat ka live visit schedule karwa de?',
  now() - interval '2 days' + interval '12 minutes'
),
(
  'c2b1a111-0001-4000-8000-000000000001',
  'in',
  'instagram',
  'lead',
  'Haan bilkul. Kal dopehar 3 baje aa sakta hoon.',
  now() - interval '1 day'
)
on conflict (id) do nothing;

-- 5. Insert Upcoming Appointments
insert into public.appointments (
  id,
  lead_id,
  type,
  property_id,
  scheduled_at,
  status,
  notes
) values
(
  'a3c2b111-0001-4000-8000-000000000001',
  'c2b1a111-0001-4000-8000-000000000001',
  'site_visit',
  'e1a0b380-6bc1-447a-8f55-14f7b6070001',
  now() + interval '1 day' + interval '3 hours',
  'booked',
  'Dr. Alok Mishra site visit for Ganga Heights 4 BHK sample flat. Show 8th floor river-facing unit.'
),
(
  'a3c2b111-0002-4000-8000-000000000002',
  'c2b1a111-0002-4000-8000-000000000002',
  'call',
  'e1a0b380-6bc1-447a-8f55-14f7b6070004',
  now() + interval '2 hours',
  'booked',
  'Detailed commercial consultation call with Vikramaditya Singhania regarding 8% rental yield clause.'
)
on conflict (id) do nothing;

-- 6. Insert Followup Tasks
insert into public.followups (
  lead_id,
  step_number,
  channel,
  scheduled_for,
  status,
  template_key
) values
(
  'c2b1a111-0003-4000-8000-000000000003',
  1,
  'whatsapp',
  now() - interval '3 hours',
  'pending',
  'emerald_park_brochure_checkin'
),
(
  'c2b1a111-0004-4000-8000-000000000004',
  1,
  'email',
  now() + interval '2 days',
  'pending',
  'kalyanpur_plot_layout'
)
on conflict (id) do nothing;

-- 7. Insert Activity Log
insert into public.activity_log (
  lead_id,
  action,
  details
) values
(
  'c2b1a111-0001-4000-8000-000000000001',
  'lead_created',
  '{"source": "instagram", "handle": "dr_alok_mishra"}'::jsonb
),
(
  'c2b1a111-0001-4000-8000-000000000001',
  'appointment_booked',
  '{"type": "site_visit", "project": "Ganga Heights Luxury Towers"}'::jsonb
),
(
  'c2b1a111-0005-4000-8000-000000000005',
  'lead_status_updated',
  '{"old_status": "negotiation", "new_status": "won", "deal_value": 18500000}'::jsonb
)
on conflict (id) do nothing;
