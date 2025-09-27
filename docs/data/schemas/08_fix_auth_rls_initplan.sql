-- 08_fix_auth_rls_initplan.sql
-- Replace direct auth.<function>() calls in RLS policies with (select auth.<function>())
-- so the auth call is evaluated once per statement (initplan) instead of per row.
-- Run this in a safe environment (staging) and take a DB backup before applying in production.

DO $$
DECLARE
  r RECORD;
  new_using TEXT;
  new_check TEXT;
  cmd TEXT;
  changed_count INT := 0;
BEGIN
  FOR r IN
    SELECT n.nspname AS schema_name,
           c.relname AS table_name,
           p.polname AS policy_name,
           pg_get_expr(p.polqual, p.polrelid) AS using_expr,
           pg_get_expr(p.polwithcheck, p.polrelid) AS check_expr
    FROM pg_policy p
    JOIN pg_class c ON p.polrelid = c.oid
    JOIN pg_namespace n ON c.relnamespace = n.oid
    WHERE n.nspname = 'public'
      AND (
        (pg_get_expr(p.polqual, p.polrelid) IS NOT NULL
         AND lower(pg_get_expr(p.polqual, p.polrelid)) LIKE '%auth.%'
         AND lower(pg_get_expr(p.polqual, p.polrelid)) NOT LIKE '%(select auth.%')
        OR
        (pg_get_expr(p.polwithcheck, p.polrelid) IS NOT NULL
         AND lower(pg_get_expr(p.polwithcheck, p.polrelid)) LIKE '%auth.%'
         AND lower(pg_get_expr(p.polwithcheck, p.polrelid)) NOT LIKE '%(select auth.%')
      );
  LOOP
    new_using := NULL;
    new_check := NULL;

    IF r.using_expr IS NOT NULL THEN
      -- Wrap occurrences of auth.foo(...)
      new_using := regexp_replace(r.using_expr,
                                 'auth\.([a-z_][a-z0-9_]*\s*\([^)]*\))',
                                 '(select auth.\1)',
                                 'gi');
    END IF;

    IF r.check_expr IS NOT NULL THEN
      new_check := regexp_replace(r.check_expr,
                                 'auth\.([a-z_][a-z0-9_]*\s*\([^)]*\))',
                                 '(select auth.\1)',
                                 'gi');
    END IF;

    IF new_using IS NOT NULL OR new_check IS NOT NULL THEN
      cmd := 'ALTER POLICY ' || quote_ident(r.policy_name) ||
             ' ON ' || quote_ident(r.schema_name) || '.' || quote_ident(r.table_name);

      IF new_using IS NOT NULL THEN
        cmd := cmd || ' USING (' || new_using || ')';
      END IF;

      IF new_check IS NOT NULL THEN
        cmd := cmd || ' WITH CHECK (' || new_check || ')';
      END IF;

      cmd := cmd || ';';

      RAISE NOTICE 'Executing: %', cmd;
      EXECUTE cmd;
      changed_count := changed_count + 1;
    END IF;
  END LOOP;

  RAISE NOTICE 'Completed. Policies updated: %', changed_count;
END
$$;
