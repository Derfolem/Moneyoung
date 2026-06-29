-- Tabela para registrar erros do cliente (app mobile e web)
-- Permite que o banco monitore falhas em tempo real no painel admin

CREATE TABLE public.client_error_reports (
  id            uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id    uuid        REFERENCES public.profiles(id) ON DELETE SET NULL,
  screen        text,
  action        text,
  error_code    text,
  error_message text        NOT NULL,
  platform      text        NOT NULL DEFAULT 'mobile',
  app_version   text,
  metadata      jsonb       NOT NULL DEFAULT '{}',
  created_at    timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_client_error_reports_created_at ON public.client_error_reports (created_at DESC);
CREATE INDEX idx_client_error_reports_profile_id  ON public.client_error_reports (profile_id);

ALTER TABLE public.client_error_reports ENABLE ROW LEVEL SECURITY;

-- Apenas bank_admin/super_admin podem ler (painel admin via cliente Supabase)
CREATE POLICY "bank_admin pode ler erros"
  ON public.client_error_reports FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid()
        AND role IN ('bank_admin', 'super_admin')
        AND status = 'active'
    )
  );

-- Inserção apenas via edge function (service role — bypassa RLS)
REVOKE INSERT, UPDATE, DELETE ON public.client_error_reports FROM anon, authenticated;
