BEGIN;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM auth.users
    WHERE id = '00000000-0000-4000-8000-000000000000'
  ) THEN
    INSERT INTO auth.users (
      id,
      instance_id,
      aud,
      role,
      email,
      encrypted_password,
      email_confirmed_at,
      confirmation_sent_at,
      raw_app_meta_data,
      raw_user_meta_data,
      is_super_admin,
      created_at,
      updated_at,
      is_sso_user,
      is_anonymous
    )
    VALUES (
      '00000000-0000-4000-8000-000000000000',
      '00000000-0000-0000-0000-000000000000',
      'authenticated',
      'authenticated',
      'system@service-center.local',
      NULL,
      NOW(),
      NOW(),
      jsonb_build_object('provider', 'system', 'providers', to_jsonb(ARRAY['system'])),
      jsonb_build_object('full_name', 'Service Center System'),
      FALSE,
      NOW(),
      NOW(),
      FALSE,
      FALSE
    );
  END IF;
END;
$$;

INSERT INTO public.profiles (
  user_id,
  full_name,
  email,
  role,
  is_active,
  created_at,
  updated_at,
  created_by,
  updated_by
)
SELECT
  '00000000-0000-4000-8000-000000000000',
  'Service Center System',
  'service-system@service-center.local',
  'manager'::public.user_role,
  TRUE,
  NOW(),
  NOW(),
  NULL,
  NULL
WHERE NOT EXISTS (
  SELECT 1
  FROM public.profiles
  WHERE user_id = '00000000-0000-4000-8000-000000000000'
);

COMMIT;
