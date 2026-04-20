-- All tables are accessed exclusively via SECURITY DEFINER server functions using
-- the service-role key. Deny every direct access from anon and authenticated roles.

ALTER TABLE public.transfers           ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transfer_files      ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.email_verifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.rate_limit_events   ENABLE ROW LEVEL SECURITY;

-- transfers
CREATE POLICY "transfers_deny_anon"          ON public.transfers FOR ALL TO anon          USING (false);
CREATE POLICY "transfers_deny_authenticated" ON public.transfers FOR ALL TO authenticated  USING (false);

-- transfer_files
CREATE POLICY "transfer_files_deny_anon"          ON public.transfer_files FOR ALL TO anon          USING (false);
CREATE POLICY "transfer_files_deny_authenticated" ON public.transfer_files FOR ALL TO authenticated  USING (false);

-- email_verifications
CREATE POLICY "email_verifications_deny_anon"          ON public.email_verifications FOR ALL TO anon          USING (false);
CREATE POLICY "email_verifications_deny_authenticated" ON public.email_verifications FOR ALL TO authenticated  USING (false);

-- rate_limit_events
CREATE POLICY "rate_limit_events_deny_anon"          ON public.rate_limit_events FOR ALL TO anon          USING (false);
CREATE POLICY "rate_limit_events_deny_authenticated" ON public.rate_limit_events FOR ALL TO authenticated  USING (false);
