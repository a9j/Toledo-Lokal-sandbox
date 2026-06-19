-- QR scan analytics. Every hit on /qr/:businessId logs one row so a business can
-- see how often its permanent QR code gets scanned. Anyone, including anonymous
-- visitors who scan a printed code, can insert a scan. Only the owning business
-- can read its own rows.

CREATE TABLE IF NOT EXISTS public.qr_scans (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id uuid NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
  scanned_at timestamptz NOT NULL DEFAULT now(),
  had_session boolean NOT NULL DEFAULT false
);

CREATE INDEX IF NOT EXISTS qr_scans_business_id_idx
  ON public.qr_scans (business_id, scanned_at DESC);

ALTER TABLE public.qr_scans ENABLE ROW LEVEL SECURITY;

-- Anyone can log a scan, even with no account.
CREATE POLICY "Anyone can log a QR scan" ON public.qr_scans
  FOR INSERT TO anon, authenticated
  WITH CHECK (true);

-- Only the business owner can read its own scan rows.
CREATE POLICY "Owners can read their QR scans" ON public.qr_scans
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.businesses b
      WHERE b.id = qr_scans.business_id
        AND b.owner_user_id = auth.uid()
    )
  );
