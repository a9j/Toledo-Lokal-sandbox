-- Performance indexes for Toledo Lokal v1

-- Saved items (My Toledo favorites) - faster lookups by user
CREATE INDEX IF NOT EXISTS idx_saved_items_user_id ON public.saved_items(user_id);
CREATE INDEX IF NOT EXISTS idx_saved_items_user_item ON public.saved_items(user_id, item_type, item_id);

-- Pulse posts - faster feed queries
CREATE INDEX IF NOT EXISTS idx_pulse_posts_status_expires ON public.pulse_posts(status, expires_at DESC) WHERE status = 'active';
CREATE INDEX IF NOT EXISTS idx_pulse_posts_business_id ON public.pulse_posts(business_id) WHERE business_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_pulse_posts_user_id ON public.pulse_posts(user_id) WHERE user_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_pulse_posts_category ON public.pulse_posts(category, created_at DESC);

-- Businesses - faster list/search queries
CREATE INDEX IF NOT EXISTS idx_businesses_status ON public.businesses(status) WHERE status = 'approved';
CREATE INDEX IF NOT EXISTS idx_businesses_category ON public.businesses(category_id) WHERE status = 'approved';
CREATE INDEX IF NOT EXISTS idx_businesses_neighborhood ON public.businesses(neighborhood_id) WHERE status = 'approved';
CREATE INDEX IF NOT EXISTS idx_businesses_featured ON public.businesses(featured, created_at DESC) WHERE status = 'approved' AND featured = true;

-- Events - faster upcoming events queries
CREATE INDEX IF NOT EXISTS idx_events_status_date ON public.events(status, start_date_time) WHERE status = 'approved';
CREATE INDEX IF NOT EXISTS idx_events_business_id ON public.events(business_id, start_date_time);

-- Deals - faster active deals queries
CREATE INDEX IF NOT EXISTS idx_deals_status_dates ON public.deals(status, start_date, end_date) WHERE status = 'approved';
CREATE INDEX IF NOT EXISTS idx_deals_business_id ON public.deals(business_id);

-- Loop transactions - faster wallet queries
CREATE INDEX IF NOT EXISTS idx_loop_transactions_wallet ON public.loop_transactions(wallet_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_loop_transactions_business ON public.loop_transactions(business_id, created_at DESC) WHERE business_id IS NOT NULL;

-- Loop QR scans - faster pending scans lookup
CREATE INDEX IF NOT EXISTS idx_loop_qr_scans_status ON public.loop_qr_scans(status, created_at DESC) WHERE status = 'pending';

-- Reviews - faster business reviews queries  
CREATE INDEX IF NOT EXISTS idx_reviews_business ON public.reviews(business_id, created_at DESC);

-- Jobs - faster active jobs queries
CREATE INDEX IF NOT EXISTS idx_jobs_status ON public.jobs(status, created_at DESC) WHERE status = 'approved';
CREATE INDEX IF NOT EXISTS idx_jobs_business ON public.jobs(business_id) WHERE status = 'approved';