
-- Create business_locations table
CREATE TABLE public.business_locations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  business_id UUID NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
  label TEXT,
  street_address TEXT NOT NULL,
  city TEXT NOT NULL DEFAULT 'Toledo',
  state TEXT NOT NULL DEFAULT 'OH',
  zip_code TEXT NOT NULL,
  neighborhood TEXT,
  latitude NUMERIC,
  longitude NUMERIC,
  phone TEXT,
  hours JSONB,
  is_primary BOOLEAN NOT NULL DEFAULT false,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.business_locations ENABLE ROW LEVEL SECURITY;

-- Public can read active locations
CREATE POLICY "Anyone can view active locations"
  ON public.business_locations
  FOR SELECT
  USING (is_active = true);

-- Business owners can manage their locations
CREATE POLICY "Business owners can insert locations"
  ON public.business_locations
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (SELECT 1 FROM public.businesses WHERE id = business_id AND owner_user_id = auth.uid())
  );

CREATE POLICY "Business owners can update locations"
  ON public.business_locations
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (SELECT 1 FROM public.businesses WHERE id = business_id AND owner_user_id = auth.uid())
  );

CREATE POLICY "Business owners can delete locations"
  ON public.business_locations
  FOR DELETE
  TO authenticated
  USING (
    EXISTS (SELECT 1 FROM public.businesses WHERE id = business_id AND owner_user_id = auth.uid())
  );

-- Staff can also manage locations
CREATE POLICY "Staff can manage locations"
  ON public.business_locations
  FOR ALL
  TO authenticated
  USING (
    EXISTS (SELECT 1 FROM public.business_staff WHERE business_id = business_locations.business_id AND user_id = auth.uid())
  );

-- Index for fast lookups
CREATE INDEX idx_business_locations_business_id ON public.business_locations(business_id);
CREATE INDEX idx_business_locations_neighborhood ON public.business_locations(neighborhood) WHERE is_active = true;

-- Migrate existing business addresses into the new table
INSERT INTO public.business_locations (business_id, street_address, city, state, zip_code, phone, hours, is_primary, neighborhood)
SELECT 
  b.id,
  COALESCE(
    CASE 
      WHEN b.address LIKE '%,%' THEN TRIM(SPLIT_PART(b.address, ',', 1))
      ELSE b.address
    END,
    ''
  ),
  'Toledo',
  'OH',
  '',
  b.phone,
  b.hours,
  true,
  n.name
FROM public.businesses b
LEFT JOIN public.neighborhoods n ON b.neighborhood_id = n.id
WHERE b.address IS NOT NULL AND b.address != '';
