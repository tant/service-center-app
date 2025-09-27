-- 09_fix_function_search_path_mutable.sql
-- Set search_path = '' for specific functions to avoid role-mutable search_path vulnerabilities.
-- This makes the function execute with an empty search_path, preventing schema "hijacking" via search_path.
-- Run in staging first and back up your DB before applying in production.

DO $$
DECLARE
  r RECORD;
  target_names text[] := ARRAY[
    'calculate_total_cost',
    'service_ticket_parts_before_insert_update',
    'service_tickets_before_insert_update',
    'service_ticket_comments_before_insert',
    'generate_ticket_number',
    'update_updated_at_column',
    'update_service_ticket_parts_total',
    'log_status_change'
  ];
  cmd text;
  changed_count int := 0;
BEGIN
  FOR r IN
    SELECT p.oid, n.nspname AS schema_name, p.proname AS function_name,
           pg_get_function_identity_arguments(p.oid) AS identity_args
    FROM pg_proc p
    JOIN pg_namespace n ON p.pronamespace = n.oid
    WHERE n.nspname = 'public'
      AND p.proname = ANY(target_names)
  LOOP
    -- Build ALTER FUNCTION with exact identity argument list to handle overloaded functions
    cmd := format('ALTER FUNCTION %I.%I(%s) SET search_path = %L',
                  r.schema_name, r.function_name, r.identity_args, '');

    RAISE NOTICE 'Applying: %', cmd;
    EXECUTE cmd;
    changed_count := changed_count + 1;
  END LOOP;

  RAISE NOTICE 'Completed. Functions updated: %', changed_count;
END
$$;

-- Optional rollback (uncomment and run if you need to remove the explicit setting):
-- DO $$
-- DECLARE r RECORD;
-- BEGIN
--   FOR r IN
--     SELECT p.oid, n.nspname AS schema_name, p.proname AS function_name,
--            pg_get_function_identity_arguments(p.oid) AS identity_args
--     FROM pg_proc p
--     JOIN pg_namespace n ON p.pronamespace = n.oid
--     WHERE n.nspname = 'public'
--       AND p.proname = ANY(ARRAY[
--         'calculate_total_cost',
--         'service_ticket_parts_before_insert_update',
--         'service_tickets_before_insert_update',
--         'service_ticket_comments_before_insert',
--         'generate_ticket_number',
--         'update_updated_at_column',
--         'update_service_ticket_parts_total',
--         'log_status_change'
--       ])
--   LOOP
--     EXECUTE format('ALTER FUNCTION %I.%I(%s) RESET search_path', r.schema_name, r.function_name, r.identity_args);
--   END LOOP;
-- END$$;
