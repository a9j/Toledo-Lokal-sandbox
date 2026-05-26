-- The Founding 5 page subscribes to businesses changes via Realtime so the
-- claimed counter and the Founding 50 progress bar update live. Add the table
-- to the publication only if it is not already there.
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime'
      AND schemaname = 'public'
      AND tablename = 'businesses'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.businesses;
  END IF;
END $$;
