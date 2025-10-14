-- =====================================================
-- 00_base_types.sql
-- =====================================================
-- Base Types: ENUMs
--
-- This file defines reusable enum types that are used across
-- the entire schema. It should be loaded before all other
-- schema files to ensure types are available.
-- =====================================================

-- =====================================================
-- ENUM TYPES
-- =====================================================

-- User Role Enum
-- Used in: profiles
drop type if exists public.user_role cascade;
create type public.user_role as enum (
  'admin',
  'manager',
  'technician',
  'reception'
);

comment on type public.user_role is 'User roles in the service center system';

-- Ticket Status Enum
-- Used in: service_tickets
drop type if exists public.ticket_status cascade;
create type public.ticket_status as enum (
  'pending',
  'in_progress',
  'completed',
  'cancelled'
);

comment on type public.ticket_status is 'Service ticket lifecycle statuses';

-- Priority Level Enum
-- Used in: service_tickets
drop type if exists public.priority_level cascade;
create type public.priority_level as enum (
  'low',
  'normal',
  'high',
  'urgent'
);

comment on type public.priority_level is 'Priority levels for service tickets';

-- Warranty Type Enum
-- Used in: service_tickets
drop type if exists public.warranty_type cascade;
create type public.warranty_type as enum (
  'warranty',
  'paid',
  'goodwill'
);

comment on type public.warranty_type is 'Warranty status of service tickets';

-- Comment Type Enum
-- Used in: service_ticket_comments
drop type if exists public.comment_type cascade;
create type public.comment_type as enum (
  'note',
  'status_change',
  'assignment',
  'system'
);

comment on type public.comment_type is 'Types of comments on service tickets';

-- =====================================================
-- GRANTS
-- =====================================================

-- Types are available to all authenticated users
grant usage on type public.user_role to authenticated;
grant usage on type public.ticket_status to authenticated;
grant usage on type public.priority_level to authenticated;
grant usage on type public.warranty_type to authenticated;
grant usage on type public.comment_type to authenticated;
