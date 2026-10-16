DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_publication_tables WHERE pubname='supabase_realtime' AND tablename='guard_locations') THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.guard_locations; END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_publication_tables WHERE pubname='supabase_realtime' AND tablename='guard_shifts') THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.guard_shifts; END IF;
END $$;