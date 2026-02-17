
-- Loop Bursts: scheduled point promotions for businesses
CREATE TABLE public.loop_bursts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  business_id UUID NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
  burst_type TEXT NOT NULL CHECK (burst_type IN ('multiplier', 'flat_bonus', 'first_visit')),
  name TEXT NOT NULL,
  description TEXT,
  -- Multiplier value (e.g., 2.0 = 2x points). Used for multiplier type.
  multiplier NUMERIC DEFAULT 1,
  -- Flat bonus points. Used for flat_bonus and first_visit types.
  bonus_points INTEGER DEFAULT 0,
  -- Scheduling
  starts_at TIMESTAMP WITH TIME ZONE NOT NULL,
  ends_at TIMESTAMP WITH TIME ZONE NOT NULL,
  -- Recurrence: null = one-time, 'daily', 'weekly'
  recurrence TEXT CHECK (recurrence IS NULL OR recurrence IN ('daily', 'weekly')),
  recurrence_days INTEGER[] DEFAULT '{}',  -- 0=Sun..6=Sat for weekly
  recurrence_start_time TIME,              -- e.g., '11:00'
  recurrence_end_time TIME,                -- e.g., '14:00'
  -- Status & limits
  is_active BOOLEAN NOT NULL DEFAULT true,
  max_redemptions INTEGER,                 -- null = unlimited
  total_redemptions INTEGER NOT NULL DEFAULT 0,
  -- Metadata
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Indexes
CREATE INDEX idx_loop_bursts_business ON public.loop_bursts(business_id);
CREATE INDEX idx_loop_bursts_active ON public.loop_bursts(is_active, starts_at, ends_at);

-- Enable RLS
ALTER TABLE public.loop_bursts ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Anyone can view active bursts"
  ON public.loop_bursts FOR SELECT
  USING (is_active = true AND ends_at > now());

CREATE POLICY "Business owners can manage their bursts"
  ON public.loop_bursts FOR ALL
  USING (business_id IN (
    SELECT id FROM public.businesses WHERE owner_user_id = auth.uid()
  ));

CREATE POLICY "Admins can manage all bursts"
  ON public.loop_bursts FOR ALL
  USING (has_role(auth.uid(), 'admin'::app_role));

-- Staff access
CREATE POLICY "Staff can view business bursts"
  ON public.loop_bursts FOR SELECT
  USING (business_id IN (
    SELECT business_id FROM public.business_staff WHERE user_id = auth.uid()
  ));

-- Timestamp trigger
CREATE TRIGGER update_loop_bursts_updated_at
  BEFORE UPDATE ON public.loop_bursts
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();
