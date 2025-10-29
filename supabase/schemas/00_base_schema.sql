-- =====================================================
-- 00_base_schema.sql
-- =====================================================
-- Base Types and Functions
--
-- This file defines reusable enum types and helper
-- functions used across the entire schema. It should be
-- loaded first to ensure types and functions are
-- available for all other schema objects.
-- =====================================================

-- =====================================================
-- CORE ENUM TYPES (from 00_base_types.sql)
-- =====================================================

-- User Role Enum
drop type if exists public.user_role cascade;
create type public.user_role as enum (
  'admin',
  'manager',
  'technician',
  'reception'
);
comment on type public.user_role is 'User roles in the service center system';

-- Ticket Status Enum
drop type if exists public.ticket_status cascade;
create type public.ticket_status as enum (
  'pending',
  'in_progress',
  'completed',
  'cancelled'
);
comment on type public.ticket_status is 'Service ticket lifecycle statuses';

-- Priority Level Enum
drop type if exists public.priority_level cascade;
create type public.priority_level as enum (
  'low',
  'normal',
  'high',
  'urgent'
);
comment on type public.priority_level is 'Priority levels for service tickets';

-- Warranty Type Enum
drop type if exists public.warranty_type cascade;
create type public.warranty_type as enum (
  'warranty',
  'paid',
  'goodwill'
);
comment on type public.warranty_type is 'Warranty status of service tickets';

-- Comment Type Enum
drop type if exists public.comment_type cascade;
create type public.comment_type as enum (
  'note',
  'status_change',
  'assignment',
  'system'
);
comment on type public.comment_type is 'Types of comments on service tickets';

-- =====================================================
-- PHASE 2 ENUM TYPES (from 11_phase2_types.sql)
-- =====================================================

-- Task Status Enum
DROP TYPE IF EXISTS public.task_status CASCADE;
CREATE TYPE public.task_status AS ENUM (
  'pending',
  'in_progress',
  'completed',
  'blocked',
  'skipped'
);
COMMENT ON TYPE public.task_status IS 'Task execution status within service ticket workflow';

-- Warehouse Type Enum
DROP TYPE IF EXISTS public.warehouse_type CASCADE;
CREATE TYPE public.warehouse_type AS ENUM (
  'main',
  'warranty_stock',
  'rma_staging',
  'dead_stock',
  'in_service',
  'parts'
);
COMMENT ON TYPE public.warehouse_type IS 'Virtual warehouse categories: main (primary storage), warranty_stock, rma_staging, dead_stock, in_service, parts';

-- Service Request Status Enum
DROP TYPE IF EXISTS public.request_status CASCADE;
CREATE TYPE public.request_status AS ENUM (
  'submitted',
  'pickingup',
  'received',
  'processing',
  'completed',
  'cancelled'
);
COMMENT ON TYPE public.request_status IS 'Status flow: submitted → pickingup → received (auto-creates tickets) → processing → completed';

-- Product Condition Enum
DROP TYPE IF EXISTS public.product_condition CASCADE;
CREATE TYPE public.product_condition AS ENUM (
  'new',
  'refurbished',
  'used',
  'faulty',
  'for_parts'
);
COMMENT ON TYPE public.product_condition IS 'Physical condition classification for inventory products';

-- Service Type Enum
DROP TYPE IF EXISTS public.service_type CASCADE;
CREATE TYPE public.service_type AS ENUM (
  'warranty',
  'paid',
  'replacement'
);
COMMENT ON TYPE public.service_type IS 'Service type classification for task template selection';

-- Delivery Method Enum
DROP TYPE IF EXISTS public.delivery_method CASCADE;
CREATE TYPE public.delivery_method AS ENUM (
  'pickup',
  'delivery'
);
COMMENT ON TYPE public.delivery_method IS 'Customer product delivery method preference';

-- Stock Movement Type Enum
DROP TYPE IF EXISTS public.movement_type CASCADE;
CREATE TYPE public.movement_type AS ENUM (
  'receipt',
  'transfer',
  'assignment',
  'return',
  'disposal'
);
COMMENT ON TYPE public.movement_type IS 'Type of stock movement transaction';

-- =====================================================
-- GRANTS FOR ALL TYPES
-- =====================================================
grant usage on type public.user_role to authenticated;
grant usage on type public.ticket_status to authenticated;
grant usage on type public.priority_level to authenticated;
grant usage on type public.warranty_type to authenticated;
grant usage on type public.comment_type to authenticated;
grant usage on type public.task_status to authenticated;
grant usage on type public.warehouse_type to authenticated;
grant usage on type public.request_status to authenticated;
grant usage on type public.product_condition to authenticated;
grant usage on type public.service_type to authenticated;
grant usage on type public.delivery_method to authenticated;
grant usage on type public.movement_type to authenticated;

-- =====================================================
-- CORE HELPER FUNCTIONS (from 00_base_functions.sql)
-- =====================================================

-- Function to automatically update updated_at timestamp
create or replace function public.update_updated_at_column()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql
set search_path = '';
comment on function public.update_updated_at_column() is 'Trigger function to automatically update updated_at timestamp';

-- Check if current user is an admin
create or replace function public.is_admin()
returns boolean as $$
begin
  return exists (
    select 1
    from public.profiles
    where user_id = auth.uid()
      and role = 'admin'
  );
end;
$$ language plpgsql security definer set search_path = '';
comment on function public.is_admin() is 'Returns true if current user has admin role';

-- Check if current user is an admin or manager
create or replace function public.is_admin_or_manager()
returns boolean as $$
begin
  return exists (
    select 1
    from public.profiles
    where user_id = auth.uid()
      and role in ('admin', 'manager')
  );
end;
$$ language plpgsql security definer set search_path = '';
comment on function public.is_admin_or_manager() is 'Returns true if current user has admin or manager role';

-- =====================================================
-- PHASE 2 HELPER FUNCTIONS (from 12_phase2_functions.sql)
-- =====================================================

-- Generates unique tracking tokens for service requests
CREATE OR REPLACE FUNCTION public.generate_tracking_token()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_token VARCHAR(15);
  v_characters VARCHAR(36) := 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  v_token_exists BOOLEAN;
  v_max_attempts INT := 100;
  v_attempt INT := 0;
BEGIN
  IF NEW.tracking_token IS NOT NULL THEN
    RETURN NEW;
  END IF;
  LOOP
    v_token := 'SR-';
    FOR i IN 1..12 LOOP
      v_token := v_token || SUBSTRING(v_characters FROM (FLOOR(RANDOM() * 36) + 1)::INT FOR 1);
    END LOOP;
    SELECT EXISTS(
      SELECT 1 FROM public.service_requests WHERE tracking_token = v_token
    ) INTO v_token_exists;
    EXIT WHEN NOT v_token_exists;
    v_attempt := v_attempt + 1;
    IF v_attempt >= v_max_attempts THEN
      RAISE EXCEPTION 'Failed to generate unique tracking token after % attempts', v_max_attempts;
    END IF;
  END LOOP;
  NEW.tracking_token := v_token;
  RETURN NEW;
END;
$$;
COMMENT ON FUNCTION public.generate_tracking_token() IS 'Auto-generates unique tracking tokens (SR-XXXXXXXXXXXX) for service requests';

-- Helper function to calculate warranty end date
CREATE OR REPLACE FUNCTION public.calculate_warranty_end_date(
  p_start_date DATE,
  p_warranty_months INT
)
RETURNS DATE
LANGUAGE plpgsql
IMMUTABLE
AS $$
BEGIN
  IF p_start_date IS NULL OR p_warranty_months IS NULL THEN
    RETURN NULL;
  END IF;
  RETURN p_start_date + (p_warranty_months || ' months')::INTERVAL;
END;
$$;
COMMENT ON FUNCTION public.calculate_warranty_end_date(DATE, INT) IS 'Calculates warranty end date from start date and warranty duration in months';

-- Returns warranty status: active, expiring_soon, expired
CREATE OR REPLACE FUNCTION public.get_warranty_status(p_warranty_end_date DATE)
RETURNS TEXT
LANGUAGE plpgsql
IMMUTABLE
AS $$
DECLARE
  v_days_remaining INT;
BEGIN
  IF p_warranty_end_date IS NULL THEN
    RETURN 'unknown';
  END IF;
  v_days_remaining := p_warranty_end_date - CURRENT_DATE;
  IF v_days_remaining < 0 THEN
    RETURN 'expired';
  ELSIF v_days_remaining <= 30 THEN
    RETURN 'expiring_soon';
  ELSE
    RETURN 'active';
  END IF;
END;
$$;
COMMENT ON FUNCTION public.get_warranty_status(DATE) IS 'Returns warranty status: active (>30 days), expiring_soon (≤30 days), expired (<0 days), or unknown';

-- Generates sequential RMA batch numbers
CREATE OR REPLACE FUNCTION public.generate_rma_batch_number()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_year VARCHAR(4);
  v_month VARCHAR(2);
  v_sequence INT;
BEGIN
  IF NEW.batch_number IS NOT NULL THEN
    RETURN NEW;
  END IF;
  v_year := TO_CHAR(NOW(), 'YYYY');
  v_month := TO_CHAR(NOW(), 'MM');
  SELECT COALESCE(MAX(
    CAST(SUBSTRING(batch_number FROM 13 FOR 3) AS INTEGER)
  ), 0) + 1
  INTO v_sequence
  FROM public.rma_batches
  WHERE batch_number LIKE 'RMA-' || v_year || '-' || v_month || '-%';
  NEW.batch_number := 'RMA-' || v_year || '-' || v_month || '-' || LPAD(v_sequence::TEXT, 3, '0');
  RETURN NEW;
END;
$$;
COMMENT ON FUNCTION public.generate_rma_batch_number() IS 'Auto-generates sequential RMA batch numbers (RMA-YYYY-MM-NNN)';

-- =====================================================
-- GRANTS FOR ALL FUNCTIONS
-- =====================================================
grant execute on function public.update_updated_at_column() to authenticated;
grant execute on function public.is_admin() to authenticated;
grant execute on function public.is_admin_or_manager() to authenticated;
grant execute on function public.generate_tracking_token() to authenticated;
grant execute on function public.calculate_warranty_end_date(DATE, INT) to authenticated;
grant execute on function public.get_warranty_status(DATE) to authenticated;
grant execute on function public.generate_rma_batch_number() to authenticated;
