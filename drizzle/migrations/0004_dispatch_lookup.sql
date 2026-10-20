-- Fleet directory lookup: resolve a person by email or phone and return
-- the live position the caller is actually allowed to see.
-- Enforcement (role + consent) lives here so no client can bypass it.
CREATE OR REPLACE FUNCTION public.dispatch_locate(_identifier text)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_uid uuid := auth.uid();
  v_raw text := btrim(coalesce(_identifier, ''));
  v_digits text := regexp_replace(btrim(coalesce(_identifier, '')), '[^0-9]', '', 'g');
  v_role public.app_role;
  v_target public.profiles%ROWTYPE;
  v_shift public.guard_shifts%ROWTYPE;
  v_loc public.guard_locations%ROWTYPE;
  v_session public.location_sessions%ROWTYPE;
  v_update public.location_updates%ROWTYPE;
BEGIN
  IF v_uid IS NULL THEN RAISE EXCEPTION 'Sign in first'; END IF;
  IF length(v_raw) < 3 THEN RAISE EXCEPTION 'Enter an email address or phone number'; END IF;

  -- Only dispatch-capable accounts may search the directory at all.
  SELECT r.role INTO v_role
    FROM public.user_roles r
   WHERE r.user_id = v_uid
     AND r.status = 'approved'
     AND r.role IN ('dispatcher','official','admin','security_company')
   ORDER BY CASE r.role WHEN 'admin' THEN 0 WHEN 'dispatcher' THEN 1 WHEN 'official' THEN 2 ELSE 3 END
   LIMIT 1;
  IF v_role IS NULL THEN
    RAISE EXCEPTION 'The fleet directory is open to dispatcher, official and security-company accounts only';
  END IF;

  SELECT * INTO v_target
    FROM public.profiles
   WHERE lower(email) = lower(v_raw)
      OR (length(v_digits) >= 7 AND regexp_replace(coalesce(phone, ''), '[^0-9]', '', 'g') = v_digits)
   LIMIT 1;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'No registered account matches that email address or phone number';
  END IF;

  -- A security company follows its own guards while they are on duty.
  IF v_role IN ('security_company','admin') THEN
    SELECT * INTO v_shift
      FROM public.guard_shifts
     WHERE guard_id = v_target.id AND status = 'on_duty'
     ORDER BY started_at DESC NULLS LAST
     LIMIT 1;
    IF v_shift.id IS NOT NULL THEN
      SELECT * INTO v_loc
        FROM public.guard_locations
       WHERE shift_id = v_shift.id
       ORDER BY device_timestamp DESC
       LIMIT 1;
      IF v_loc.id IS NOT NULL THEN
        INSERT INTO public.audit_logs(actor_id, action, target_id, details)
          VALUES (v_uid, 'dispatch_lookup', v_target.id, jsonb_build_object('role', v_role, 'source', 'guard_shift'));
        RETURN jsonb_build_object(
          'status', 'found',
          'name', coalesce(v_target.display_name, 'Account holder'),
          'email', v_target.email,
          'phone', v_target.phone,
          'source', 'On-duty guard shift',
          'scope', 'company',
          'zone', v_shift.zone_name,
          'lat', v_loc.latitude,
          'lng', v_loc.longitude,
          'accuracy', v_loc.accuracy,
          'recorded_at', v_loc.device_timestamp
        );
      END IF;
    END IF;
  END IF;

  -- Otherwise the person must have shared a live session with the caller.
  SELECT * INTO v_session
    FROM public.location_sessions s
   WHERE s.owner_id = v_target.id AND public.can_view_session(s.id, v_uid)
   ORDER BY s.started_at DESC
   LIMIT 1;
  IF v_session.id IS NOT NULL THEN
    SELECT * INTO v_update
      FROM public.location_updates
     WHERE session_id = v_session.id
     ORDER BY recorded_at DESC
     LIMIT 1;
    INSERT INTO public.audit_logs(actor_id, action, target_id, details)
      VALUES (v_uid, 'dispatch_lookup', v_target.id, jsonb_build_object('role', v_role, 'source', 'live_session'));
    RETURN jsonb_build_object(
      'status', 'found',
      'name', coalesce(v_target.display_name, 'Account holder'),
      'email', v_target.email,
      'phone', v_target.phone,
      'source', v_session.purpose,
      'scope', v_session.scope,
      'lat', v_update.lat,
      'lng', v_update.lng,
      'accuracy', v_update.accuracy,
      'recorded_at', v_update.recorded_at,
      'session_id', v_session.id
    );
  END IF;

  INSERT INTO public.audit_logs(actor_id, action, target_id, details)
    VALUES (v_uid, 'dispatch_lookup_denied', v_target.id, jsonb_build_object('role', v_role));
  RAISE EXCEPTION '% is not sharing a live location with you', coalesce(v_target.display_name, 'That account');
END
$$;

REVOKE EXECUTE ON FUNCTION public.dispatch_locate(text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.dispatch_locate(text) TO authenticated;