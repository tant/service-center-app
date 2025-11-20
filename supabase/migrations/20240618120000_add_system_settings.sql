-- Migration: add system_settings table for app configuration
-- Notes: includes RLS (admin/manager), default seed for default_workflows

CREATE TABLE IF NOT EXISTS public.system_settings (
  key TEXT PRIMARY KEY,
  value JSONB NOT NULL,
  category TEXT NOT NULL DEFAULT 'general',
  description TEXT,
  updated_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE public.system_settings IS 'Global application configuration (key/value, JSONB)';
COMMENT ON COLUMN public.system_settings.key IS 'Setting key, unique per configuration item';
COMMENT ON COLUMN public.system_settings.value IS 'JSONB payload for the setting';
COMMENT ON COLUMN public.system_settings.category IS 'Logical grouping of settings (e.g., workflow, notifications)';
COMMENT ON COLUMN public.system_settings.updated_by IS 'profiles.id of the last user who updated the setting';

CREATE INDEX IF NOT EXISTS system_settings_value_gin ON public.system_settings USING gin (value jsonb_path_ops);

CREATE TRIGGER trigger_system_settings_updated_at
BEFORE UPDATE ON public.system_settings
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

ALTER TABLE public.system_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY system_settings_admin_select
  ON public.system_settings
  FOR SELECT
  USING (public.is_admin_or_manager());

CREATE POLICY system_settings_admin_insert
  ON public.system_settings
  FOR INSERT
  WITH CHECK (public.is_admin_or_manager());

CREATE POLICY system_settings_admin_update
  ON public.system_settings
  FOR UPDATE
  USING (public.is_admin_or_manager())
  WITH CHECK (public.is_admin_or_manager());

CREATE POLICY system_settings_admin_delete
  ON public.system_settings
  FOR DELETE
  USING (public.is_admin_or_manager());

INSERT INTO public.system_settings (key, value, category, description)
VALUES ('default_workflows', '{}'::jsonb, 'workflow', 'Default workflows mapping per ticket type')
ON CONFLICT (key) DO NOTHING;
