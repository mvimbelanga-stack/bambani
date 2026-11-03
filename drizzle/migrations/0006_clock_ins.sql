CREATE TABLE public.clock_ins (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id uuid NOT NULL UNIQUE,
  user_id uuid NOT NULL DEFAULT auth.uid(),
  "timestamp" timestamptz NOT NULL DEFAULT now(),
  latitude double precision NOT NULL CHECK (latitude BETWEEN -90 AND 90),
  longitude double precision NOT NULL CHECK (longitude BETWEEN -180 AND 180),
  gps_accuracy double precision NOT NULL CHECK (gps_accuracy >= 0),
  liveness_score double precision NOT NULL CHECK (liveness_score BETWEEN 0 AND 1),
  face_thumbnail_url text,
  status text NOT NULL DEFAULT 'failed' CHECK (status IN ('approved','failed')),
  device_info jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX clock_ins_ts_idx ON public.clock_ins ("timestamp" DESC);
GRANT SELECT, INSERT ON public.clock_ins TO authenticated;
GRANT ALL ON public.clock_ins TO service_role;
ALTER TABLE public.clock_ins ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.clock_in_set_status() RETURNS trigger
LANGUAGE plpgsql SET search_path = public AS $$
BEGIN
  NEW.status := CASE WHEN NEW.liveness_score >= 0.85 AND NEW.gps_accuracy <= 50 THEN 'approved' ELSE 'failed' END;
  NEW.created_at := now();
  IF NEW."timestamp" > now() + interval '5 minutes' OR NEW."timestamp" < now() - interval '7 days' THEN
    RAISE EXCEPTION 'Clock-in time out of range';
  END IF;
  RETURN NEW;
END $$;
CREATE TRIGGER clock_in_status BEFORE INSERT ON public.clock_ins
FOR EACH ROW EXECUTE FUNCTION public.clock_in_set_status();

CREATE POLICY "clock_ins insert own" ON public.clock_ins FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid());
CREATE POLICY "clock_ins read own or supervisor" ON public.clock_ins FOR SELECT TO authenticated
  USING (user_id = auth.uid() OR public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'dispatcher') OR public.has_role(auth.uid(),'security_company'));