-- Base database functions used across all tables
-- These functions must be created first before any tables that use them

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
