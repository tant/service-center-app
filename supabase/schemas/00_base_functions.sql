-- =====================================================
-- 00_base_functions.sql
-- =====================================================
-- Base Helper Functions
--
-- This file defines reusable helper functions used across
-- the schema. These functions must be created before any
-- tables that use them. Load after 00_base_types.sql.
-- =====================================================

-- =====================================================
-- TIMESTAMP FUNCTIONS
-- =====================================================

-- Function to automatically update updated_at timestamp
-- Used by triggers on all tables to maintain accurate modification timestamps
-- Security: SET search_path = '' prevents schema hijacking vulnerabilities
create or replace function update_updated_at_column()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql
set search_path = '';

comment on function update_updated_at_column() is 'Trigger function to automatically update updated_at timestamp';

-- =====================================================
-- RLS HELPER FUNCTIONS
-- =====================================================

-- Check if current user is an admin
-- Used in: RLS policies, storage policies
create or replace function public.is_admin()
returns boolean as $$
begin
  return exists (
    select 1
    from public.profiles
    where user_id = auth.uid()
      and 'admin' = any(roles)
  );
end;
$$ language plpgsql security definer set search_path = 'public';

comment on function public.is_admin() is 'Returns true if current user has admin role';

-- Check if current user is an admin or manager
-- Used in: RLS policies, storage policies
create or replace function public.is_admin_or_manager()
returns boolean as $$
begin
  return exists (
    select 1
    from public.profiles
    where user_id = auth.uid()
      and ('admin' = any(roles) or 'manager' = any(roles))
  );
end;
$$ language plpgsql security definer set search_path = 'public';

comment on function public.is_admin_or_manager() is 'Returns true if current user has admin or manager role';

-- =====================================================
-- GRANTS
-- =====================================================

-- Functions are available to all authenticated users
grant execute on function update_updated_at_column() to authenticated;
grant execute on function public.is_admin() to authenticated;
grant execute on function public.is_admin_or_manager() to authenticated;
