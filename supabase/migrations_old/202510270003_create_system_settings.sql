-- Create system_settings table to store key/value system configuration
CREATE TABLE IF NOT EXISTS public.system_settings (
  key TEXT PRIMARY KEY,
  value JSONB NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE public.system_settings IS 'Key/value store for system configuration';

-- Seed default setting for default_rma_return_warehouse
INSERT INTO public.system_settings (key,value) VALUES (
  'default_rma_return_warehouse',
  jsonb_build_object('warehouse_type', 'main')
) ON CONFLICT (key) DO NOTHING;

-- Enable RLS and policy for admins
ALTER TABLE public.system_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY system_settings_admin_all ON public.system_settings
  FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM public.profiles WHERE profiles.user_id = auth.uid() AND profiles.role IN ('admin','manager')))
  WITH CHECK (EXISTS (SELECT 1 FROM public.profiles WHERE profiles.user_id = auth.uid() AND profiles.role IN ('admin','manager')));

CREATE POLICY system_settings_read ON public.system_settings
  FOR SELECT TO authenticated
  USING (true);