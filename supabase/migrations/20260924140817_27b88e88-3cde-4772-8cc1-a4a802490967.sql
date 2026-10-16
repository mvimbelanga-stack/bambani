DO $$ DECLARE f text; BEGIN
FOREACH f IN ARRAY ARRAY[
 'public.has_role(uuid,public.app_role)','public.write_audit(text,uuid,jsonb)','public.session_is_live(uuid)','public.is_session_owner(uuid,uuid)','public.can_view_session(uuid,uuid)',
 'public.request_role(public.app_role)','public.drop_my_role(public.app_role)','public.admin_set_role(uuid,public.app_role,public.role_status)','public.admin_remove_role(uuid,public.app_role)',
 'public.add_session_viewer(uuid,text)','public.log_location_view(uuid)','public.delete_my_session(uuid)'] LOOP
  EXECUTE format('REVOKE EXECUTE ON FUNCTION %s FROM PUBLIC, anon', f);
  EXECUTE format('GRANT EXECUTE ON FUNCTION %s TO authenticated', f);
END LOOP;
FOREACH f IN ARRAY ARRAY['public.check_session_consent()','public.audit_session_change()','public.audit_consent_change()','public.handle_new_user()','public.purge_expired_location_data()'] LOOP
  EXECUTE format('REVOKE EXECUTE ON FUNCTION %s FROM PUBLIC, anon, authenticated', f);
END LOOP;
END $$;
REVOKE EXECUTE ON FUNCTION public.write_audit(text,uuid,jsonb) FROM authenticated;
DROP FUNCTION public.write_audit(text,uuid,jsonb);