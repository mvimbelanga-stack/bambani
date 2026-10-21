CREATE TABLE public.evidence_vault (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  reporter_id uuid NOT NULL DEFAULT auth.uid(),
  title text NOT NULL CHECK (char_length(title) BETWEEN 1 AND 200),
  description text NOT NULL CHECK (char_length(description) BETWEEN 1 AND 5000),
  latitude double precision NOT NULL,
  longitude double precision NOT NULL,
  hardware_fingerprint text NOT NULL,
  is_locked_for_court boolean NOT NULL DEFAULT true,
  sealed_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT ON public.evidence_vault TO authenticated;
GRANT ALL ON public.evidence_vault TO service_role;
ALTER TABLE public.evidence_vault ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Reporters seal their own evidence" ON public.evidence_vault FOR INSERT TO authenticated
  WITH CHECK (reporter_id = auth.uid() AND is_locked_for_court = true);
CREATE POLICY "Reporters and officials read evidence" ON public.evidence_vault FOR SELECT TO authenticated
  USING (reporter_id = auth.uid() OR public.has_role(auth.uid(),'official') OR public.has_role(auth.uid(),'admin'));
-- No UPDATE/DELETE policies: sealed records are immutable.