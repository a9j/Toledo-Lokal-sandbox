-- Jobs table for business hiring posts
CREATE TABLE public.jobs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  business_id UUID NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  job_type TEXT NOT NULL CHECK (job_type IN ('full-time', 'part-time', 'seasonal', 'entry-level', 'skilled-trades', 'internship', 'gig')),
  pay_min NUMERIC,
  pay_max NUMERIC,
  pay_type TEXT DEFAULT 'hourly' CHECK (pay_type IN ('hourly', 'salary', 'flat-rate', 'tips')),
  schedule TEXT,
  description TEXT,
  start_date DATE,
  hiring_now BOOLEAN DEFAULT true,
  apply_method TEXT NOT NULL CHECK (apply_method IN ('email', 'phone', 'link')),
  apply_contact TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'filled', 'expired')),
  featured BOOLEAN DEFAULT false,
  view_count INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Food truck / pop-up daily locations
CREATE TABLE public.food_truck_locations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  business_id UUID NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
  location_date DATE NOT NULL,
  location_name TEXT NOT NULL,
  address TEXT,
  latitude NUMERIC,
  longitude NUMERIC,
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  notes TEXT,
  featured BOOLEAN DEFAULT false,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'cancelled')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Business feature toggles (hiring, food_truck enabled)
CREATE TABLE public.business_features (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  business_id UUID NOT NULL UNIQUE REFERENCES public.businesses(id) ON DELETE CASCADE,
  hiring_enabled BOOLEAN DEFAULT false,
  food_truck_enabled BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on all tables
ALTER TABLE public.jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.food_truck_locations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.business_features ENABLE ROW LEVEL SECURITY;

-- Jobs policies
CREATE POLICY "Anyone can view approved jobs" ON public.jobs
  FOR SELECT USING (status = 'approved');

CREATE POLICY "Business owners can manage their jobs" ON public.jobs
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.businesses 
      WHERE id = jobs.business_id 
      AND owner_user_id = auth.uid()
    )
  );

CREATE POLICY "Staff can manage business jobs" ON public.jobs
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.business_staff 
      WHERE business_id = jobs.business_id 
      AND user_id = auth.uid()
    )
  );

-- Food truck locations policies
CREATE POLICY "Anyone can view active food truck locations" ON public.food_truck_locations
  FOR SELECT USING (status = 'active');

CREATE POLICY "Business owners can manage their locations" ON public.food_truck_locations
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.businesses 
      WHERE id = food_truck_locations.business_id 
      AND owner_user_id = auth.uid()
    )
  );

CREATE POLICY "Staff can manage business locations" ON public.food_truck_locations
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.business_staff 
      WHERE business_id = food_truck_locations.business_id 
      AND user_id = auth.uid()
    )
  );

-- Business features policies
CREATE POLICY "Anyone can view business features" ON public.business_features
  FOR SELECT USING (true);

CREATE POLICY "Business owners can manage their features" ON public.business_features
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.businesses 
      WHERE id = business_features.business_id 
      AND owner_user_id = auth.uid()
    )
  );

-- Add updated_at trigger for jobs
CREATE TRIGGER update_jobs_updated_at
  BEFORE UPDATE ON public.jobs
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Add updated_at trigger for business_features
CREATE TRIGGER update_business_features_updated_at
  BEFORE UPDATE ON public.business_features
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Create indexes for performance
CREATE INDEX idx_jobs_business_id ON public.jobs(business_id);
CREATE INDEX idx_jobs_status ON public.jobs(status);
CREATE INDEX idx_jobs_job_type ON public.jobs(job_type);
CREATE INDEX idx_jobs_hiring_now ON public.jobs(hiring_now);
CREATE INDEX idx_food_truck_locations_business_id ON public.food_truck_locations(business_id);
CREATE INDEX idx_food_truck_locations_date ON public.food_truck_locations(location_date);
CREATE INDEX idx_food_truck_locations_status ON public.food_truck_locations(status);