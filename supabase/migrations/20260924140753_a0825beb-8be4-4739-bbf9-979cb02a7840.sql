CREATE TYPE public.app_role AS ENUM ('civilian','guardian','family_member','employee','patroller','dispatcher','official','admin');
CREATE TYPE public.role_status AS ENUM ('approved','pending','rejected');
CREATE TYPE public.consent_scope AS ENUM ('track_me','suspicious_ride','escort','family','company','official_protection');

CREATE TABLE public.profiles (
  id uuid PRIMARY KEY,
  display_name text,
  email text,
  phone text,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE ON public.profiles TO authenticated;
GRANT ALL ON public.profiles TO service_role;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE TABLE public.user_roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  role public.app_role NOT NULL,
  status public.role_status NOT NULL DEFAULT 'pending',
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, role)
);
GRANT SELECT ON public.user_roles TO authenticated;
GRANT ALL ON public.user_roles TO service_role;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role public.app_role)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id=_user_id AND role=_role AND status='approved')
$$;

CREATE TABLE public.audit_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  actor_id uuid,
  action text NOT NULL,
  target_id uuid,
  details jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.audit_logs TO authenticated;
GRANT ALL ON public.audit_logs TO service_role;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.write_audit(_action text, _target uuid, _details jsonb DEFAULT '{}'::jsonb)
RETURNS void LANGUAGE sql SECURITY DEFINER SET search_path = public AS $$
  INSERT INTO public.audit_logs(actor_id, action, target_id, details) VALUES (auth.uid(), _action, _target, coalesce(_details,'{}'::jsonb));
$$;

CREATE TABLE public.consents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  scope public.consent_scope NOT NULL,
  policy_version text NOT NULL,
  accepted_at timestamptz NOT NULL DEFAULT now(),
  withdrawn_at timestamptz
);
GRANT SELECT, INSERT, UPDATE ON public.consents TO authenticated;
GRANT ALL ON public.consents TO service_role;
ALTER TABLE public.consents ENABLE ROW LEVEL SECURITY;

CREATE TABLE public.location_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id uuid NOT NULL,
  purpose text NOT NULL,
  scope public.consent_scope NOT NULL,
  retention_category text NOT NULL DEFAULT 'standard',
  started_at timestamptz NOT NULL DEFAULT now(),
  planned_end_at timestamptz NOT NULL,
  ended_at timestamptz,
  anonymised boolean NOT NULL DEFAULT false
);
GRANT SELECT, INSERT, UPDATE ON public.location_sessions TO authenticated;
GRANT ALL ON public.location_sessions TO service_role;
ALTER TABLE public.location_sessions ENABLE ROW LEVEL SECURITY;

CREATE TABLE public.session_viewers (
  session_id uuid NOT NULL REFERENCES public.location_sessions(id) ON DELETE CASCADE,
  viewer_id uuid NOT NULL,
  added_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (session_id, viewer_id)
);
GRANT SELECT, DELETE ON public.session_viewers TO authenticated;
GRANT ALL ON public.session_viewers TO service_role;
ALTER TABLE public.session_viewers ENABLE ROW LEVEL SECURITY;

CREATE TABLE public.location_updates (
  id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  session_id uuid NOT NULL REFERENCES public.location_sessions(id) ON DELETE CASCADE,
  lat double precision NOT NULL,
  lng double precision NOT NULL,
  accuracy double precision,
  speed double precision,
  recorded_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT ON public.location_updates TO authenticated;
GRANT ALL ON public.location_updates TO service_role;
ALTER TABLE public.location_updates ENABLE ROW LEVEL SECURITY;

-- helpers
CREATE OR REPLACE FUNCTION public.session_is_live(_sid uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.location_sessions WHERE id=_sid AND ended_at IS NULL AND planned_end_at > now() AND NOT anonymised)
$$;
CREATE OR REPLACE FUNCTION public.is_session_owner(_sid uuid, _uid uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.location_sessions WHERE id=_sid AND owner_id=_uid)
$$;
CREATE OR REPLACE FUNCTION public.can_view_session(_sid uuid, _uid uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT public.is_session_owner(_sid,_uid) OR (
    public.session_is_live(_sid)
    AND EXISTS (SELECT 1 FROM public.session_viewers v WHERE v.session_id=_sid AND v.viewer_id=_uid)
    AND (
      (SELECT scope FROM public.location_sessions WHERE id=_sid) <> 'official_protection'
      OR public.has_role(_uid,'official')
    )
  )
$$;

-- policies
CREATE POLICY "own profile read" ON public.profiles FOR SELECT TO authenticated USING (id = auth.uid() OR public.has_role(auth.uid(),'admin'));
CREATE POLICY "own profile update" ON public.profiles FOR UPDATE TO authenticated USING (id = auth.uid()) WITH CHECK (id = auth.uid());
CREATE POLICY "own profile insert" ON public.profiles FOR INSERT TO authenticated WITH CHECK (id = auth.uid());

CREATE POLICY "roles read own or admin" ON public.user_roles FOR SELECT TO authenticated USING (user_id = auth.uid() OR public.has_role(auth.uid(),'admin'));

CREATE POLICY "audit read own or admin" ON public.audit_logs FOR SELECT TO authenticated USING (actor_id = auth.uid() OR public.has_role(auth.uid(),'admin'));

CREATE POLICY "consents own read" ON public.consents FOR SELECT TO authenticated USING (user_id = auth.uid());
CREATE POLICY "consents own insert" ON public.consents FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());
CREATE POLICY "consents own update" ON public.consents FOR UPDATE TO authenticated USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

CREATE POLICY "sessions view" ON public.location_sessions FOR SELECT TO authenticated USING (public.can_view_session(id, auth.uid()));
CREATE POLICY "sessions insert own" ON public.location_sessions FOR INSERT TO authenticated WITH CHECK (owner_id = auth.uid());
CREATE POLICY "sessions update own" ON public.location_sessions FOR UPDATE TO authenticated USING (owner_id = auth.uid()) WITH CHECK (owner_id = auth.uid());

CREATE POLICY "viewers read" ON public.session_viewers FOR SELECT TO authenticated USING (viewer_id = auth.uid() OR public.is_session_owner(session_id, auth.uid()));
CREATE POLICY "viewers owner remove" ON public.session_viewers FOR DELETE TO authenticated USING (public.is_session_owner(session_id, auth.uid()));

CREATE POLICY "updates view" ON public.location_updates FOR SELECT TO authenticated USING (public.can_view_session(session_id, auth.uid()));
CREATE POLICY "updates owner insert live" ON public.location_updates FOR INSERT TO authenticated WITH CHECK (public.is_session_owner(session_id, auth.uid()) AND public.session_is_live(session_id));

-- consent gate on session start
CREATE OR REPLACE FUNCTION public.check_session_consent()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM public.consents WHERE user_id=NEW.owner_id AND scope=NEW.scope AND withdrawn_at IS NULL) THEN
    RAISE EXCEPTION 'Consent for % is required before tracking can start', NEW.scope;
  END IF;
  IF NEW.planned_end_at <= now() OR NEW.planned_end_at > now() + interval '12 hours' THEN
    RAISE EXCEPTION 'Session must end within 12 hours';
  END IF;
  IF NEW.scope = 'official_protection' AND NOT public.has_role(NEW.owner_id,'official') THEN
    RAISE EXCEPTION 'Official protection sessions require the Official role';
  END IF;
  RETURN NEW;
END $$;
CREATE TRIGGER trg_session_consent BEFORE INSERT ON public.location_sessions FOR EACH ROW EXECUTE FUNCTION public.check_session_consent();

CREATE OR REPLACE FUNCTION public.audit_session_change()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF TG_OP='INSERT' THEN
    INSERT INTO public.audit_logs(actor_id,action,target_id,details) VALUES (NEW.owner_id,'session_start',NEW.id,jsonb_build_object('scope',NEW.scope,'purpose',NEW.purpose));
  ELSIF NEW.ended_at IS NOT NULL AND OLD.ended_at IS NULL THEN
    INSERT INTO public.audit_logs(actor_id,action,target_id) VALUES (auth.uid(),'session_stop',NEW.id);
  END IF;
  RETURN NEW;
END $$;
CREATE TRIGGER trg_session_audit AFTER INSERT OR UPDATE ON public.location_sessions FOR EACH ROW EXECUTE FUNCTION public.audit_session_change();

CREATE OR REPLACE FUNCTION public.audit_consent_change()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.audit_logs(actor_id,action,target_id,details) VALUES (NEW.user_id,
    CASE WHEN TG_OP='INSERT' THEN 'consent_given' ELSE 'consent_withdrawn' END, NEW.id,
    jsonb_build_object('scope',NEW.scope,'version',NEW.policy_version));
  RETURN NEW;
END $$;
CREATE TRIGGER trg_consent_audit AFTER INSERT OR UPDATE ON public.consents FOR EACH ROW EXECUTE FUNCTION public.audit_consent_change();

-- new user
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.profiles(id, display_name, email, phone)
  VALUES (NEW.id, coalesce(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name', split_part(coalesce(NEW.email,''),'@',1)), NEW.email, NEW.phone);
  INSERT INTO public.user_roles(user_id, role, status) VALUES (NEW.id,'civilian','approved');
  RETURN NEW;
END $$;
CREATE TRIGGER on_auth_user_created AFTER INSERT ON auth.users FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- RPCs
CREATE OR REPLACE FUNCTION public.request_role(_role public.app_role)
RETURNS public.role_status LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE s public.role_status;
BEGIN
  IF auth.uid() IS NULL THEN RAISE EXCEPTION 'Not signed in'; END IF;
  s := CASE WHEN _role IN ('civilian','guardian','family_member','employee') THEN 'approved' ELSE 'pending' END;
  INSERT INTO public.user_roles(user_id, role, status) VALUES (auth.uid(), _role, s)
  ON CONFLICT (user_id, role) DO UPDATE SET status = CASE WHEN public.user_roles.status='rejected' THEN s ELSE public.user_roles.status END;
  INSERT INTO public.audit_logs(actor_id,action,details) VALUES (auth.uid(),'role_requested',jsonb_build_object('role',_role,'status',s));
  RETURN s;
END $$;

CREATE OR REPLACE FUNCTION public.drop_my_role(_role public.app_role)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  DELETE FROM public.user_roles WHERE user_id=auth.uid() AND role=_role AND role<>'admin';
  INSERT INTO public.audit_logs(actor_id,action,details) VALUES (auth.uid(),'role_dropped',jsonb_build_object('role',_role));
END $$;

CREATE OR REPLACE FUNCTION public.admin_set_role(_user uuid, _role public.app_role, _status public.role_status)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NOT public.has_role(auth.uid(),'admin') THEN RAISE EXCEPTION 'Admins only'; END IF;
  INSERT INTO public.user_roles(user_id, role, status) VALUES (_user,_role,_status)
  ON CONFLICT (user_id, role) DO UPDATE SET status=_status;
  INSERT INTO public.audit_logs(actor_id,action,target_id,details) VALUES (auth.uid(),'role_'||_status::text,_user,jsonb_build_object('role',_role));
END $$;

CREATE OR REPLACE FUNCTION public.admin_remove_role(_user uuid, _role public.app_role)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NOT public.has_role(auth.uid(),'admin') THEN RAISE EXCEPTION 'Admins only'; END IF;
  DELETE FROM public.user_roles WHERE user_id=_user AND role=_role;
  INSERT INTO public.audit_logs(actor_id,action,target_id,details) VALUES (auth.uid(),'role_removed',_user,jsonb_build_object('role',_role));
END $$;

CREATE OR REPLACE FUNCTION public.add_session_viewer(_sid uuid, _email text)
RETURNS boolean LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE vid uuid;
BEGIN
  IF NOT public.is_session_owner(_sid, auth.uid()) THEN RAISE EXCEPTION 'Only the owner can add viewers'; END IF;
  SELECT id INTO vid FROM public.profiles WHERE lower(email)=lower(trim(_email)) LIMIT 1;
  IF vid IS NULL OR vid = auth.uid() THEN RETURN false; END IF;
  INSERT INTO public.session_viewers(session_id, viewer_id) VALUES (_sid, vid) ON CONFLICT DO NOTHING;
  INSERT INTO public.audit_logs(actor_id,action,target_id,details) VALUES (auth.uid(),'viewer_added',_sid,jsonb_build_object('viewer',vid));
  RETURN true;
END $$;

CREATE OR REPLACE FUNCTION public.log_location_view(_sid uuid)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NOT public.can_view_session(_sid, auth.uid()) THEN RAISE EXCEPTION 'No access'; END IF;
  INSERT INTO public.audit_logs(actor_id,action,target_id) VALUES (auth.uid(),'location_view',_sid);
END $$;

CREATE OR REPLACE FUNCTION public.delete_my_session(_sid uuid)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NOT public.is_session_owner(_sid, auth.uid()) THEN RAISE EXCEPTION 'Not your session'; END IF;
  IF public.session_is_live(_sid) THEN RAISE EXCEPTION 'Stop the session before deleting it'; END IF;
  IF (SELECT retention_category FROM public.location_sessions WHERE id=_sid)='emergency_evidence' THEN
    RAISE EXCEPTION 'Emergency evidence is held under the legal retention policy';
  END IF;
  DELETE FROM public.location_updates WHERE session_id=_sid;
  DELETE FROM public.session_viewers WHERE session_id=_sid;
  UPDATE public.location_sessions SET anonymised=true, purpose='[deleted]', ended_at=coalesce(ended_at,now()) WHERE id=_sid;
  INSERT INTO public.audit_logs(actor_id,action,target_id) VALUES (auth.uid(),'session_deleted',_sid);
END $$;

CREATE OR REPLACE FUNCTION public.purge_expired_location_data()
RETURNS integer LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE n integer;
BEGIN
  WITH expired AS (
    SELECT id FROM public.location_sessions
    WHERE NOT anonymised AND coalesce(ended_at, planned_end_at) < now() - CASE retention_category
      WHEN 'emergency_evidence' THEN interval '365 days' ELSE interval '30 days' END
  ), d AS (DELETE FROM public.location_updates WHERE session_id IN (SELECT id FROM expired))
  UPDATE public.location_sessions s SET anonymised=true, purpose='[expired]' FROM expired e WHERE s.id=e.id;
  GET DIAGNOSTICS n = ROW_COUNT;
  INSERT INTO public.audit_logs(action,details) VALUES ('retention_job',jsonb_build_object('anonymised',n));
  RETURN n;
END $$;

REVOKE EXECUTE ON FUNCTION public.purge_expired_location_data() FROM PUBLIC, anon, authenticated;

ALTER PUBLICATION supabase_realtime ADD TABLE public.location_updates;
ALTER PUBLICATION supabase_realtime ADD TABLE public.location_sessions;