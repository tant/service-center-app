-- UAT Sample Data for Phase 1 Testing
-- Polymorphic Task Management System
-- Version: 1.0
-- Date: 2025-11-03
--
-- This script sets up test data for User Acceptance Testing
-- Run this on a CLEAN TEST DATABASE (not production!)
--
-- Usage:
--   psql $DATABASE_URL < docs/data/uat-sample-data.sql

-- ============================================
-- 1. Verify we're not on production
-- ============================================
DO $$
BEGIN
    IF current_database() = 'production' OR current_database() LIKE '%prod%' THEN
        RAISE EXCEPTION 'SAFETY CHECK: Cannot run UAT data on production database!';
    END IF;
    RAISE NOTICE 'Database: % - Proceeding with UAT data setup', current_database();
END $$;

-- ============================================
-- 2. Test User Setup (if not exists)
-- ============================================

-- Note: These are the existing test users from global setup
-- We're just verifying they exist and have the correct data

-- Admin user (already exists from setup)
-- Manager, Technicians already exist from previous testing

-- Verify users exist
DO $$
DECLARE
    admin_count INTEGER;
    manager_count INTEGER;
    tech_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO admin_count FROM profiles WHERE role = 'admin';
    SELECT COUNT(*) INTO manager_count FROM profiles WHERE role = 'manager';
    SELECT COUNT(*) INTO tech_count FROM profiles WHERE role = 'technician';

    RAISE NOTICE 'User counts - Admin: %, Manager: %, Technician: %',
        admin_count, manager_count, tech_count;

    IF admin_count = 0 OR manager_count = 0 OR tech_count < 2 THEN
        RAISE WARNING 'Not enough test users! Please run global setup first.';
    END IF;
END $$;

-- ============================================
-- 3. Test Customers (already exist from Phase 1)
-- ============================================

-- Verify customers exist
DO $$
DECLARE
    customer_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO customer_count
    FROM customers
    WHERE name IN ('Nguyễn Văn A', 'Trần Thị B', 'Lê Văn C');

    IF customer_count = 3 THEN
        RAISE NOTICE 'Test customers found: 3';
    ELSE
        RAISE WARNING 'Expected 3 test customers, found %', customer_count;
    END IF;
END $$;

-- ============================================
-- 4. Service Tickets (already exist from Phase 1)
-- ============================================

-- Verify service tickets exist
DO $$
DECLARE
    ticket_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO ticket_count
    FROM service_tickets
    WHERE ticket_number IN ('SV-2025-001', 'SV-2025-002', 'SV-2025-003');

    IF ticket_count = 3 THEN
        RAISE NOTICE 'Test service tickets found: 3';
    ELSE
        RAISE WARNING 'Expected 3 test tickets, found %', ticket_count;
    END IF;
END $$;

-- ============================================
-- 5. Entity Tasks (already exist from Phase 1)
-- ============================================

-- Verify entity tasks exist
DO $$
DECLARE
    task_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO task_count FROM entity_tasks;

    IF task_count >= 8 THEN
        RAISE NOTICE 'Test entity tasks found: %', task_count;
    ELSE
        RAISE WARNING 'Expected at least 8 test tasks, found %', task_count;
    END IF;
END $$;

-- ============================================
-- 6. Update task due dates for UAT (relative to today)
-- ============================================

-- Make sure we have tasks with different due dates relative to UAT date
UPDATE entity_tasks
SET due_date = CASE
    WHEN sequence_order = 1 THEN NOW() + INTERVAL '1 day'
    WHEN sequence_order = 2 THEN NOW() + INTERVAL '2 days'
    WHEN sequence_order = 3 THEN NOW() + INTERVAL '3 days'
    WHEN sequence_order = 4 THEN NOW() + INTERVAL '4 days'
    ELSE NOW() + INTERVAL '5 days'
END
WHERE entity_type = 'service_ticket'
AND entity_id IN (
    SELECT id FROM service_tickets
    WHERE ticket_number IN ('SV-2025-001', 'SV-2025-002', 'SV-2025-003')
);

-- Create one overdue task for testing
UPDATE entity_tasks
SET due_date = NOW() - INTERVAL '1 day'
WHERE entity_type = 'service_ticket'
AND status = 'pending'
AND entity_id = (SELECT id FROM service_tickets WHERE ticket_number = 'SV-2025-002')
AND sequence_order = 2
LIMIT 1;

RAISE NOTICE 'Task due dates updated relative to today';

-- ============================================
-- 7. Assign tasks to test users for UAT
-- ============================================

-- Assign some tasks to admin
UPDATE entity_tasks
SET assigned_to_id = (SELECT user_id FROM profiles WHERE role = 'admin' LIMIT 1)
WHERE entity_type = 'service_ticket'
AND entity_id = (SELECT id FROM service_tickets WHERE ticket_number = 'SV-2025-001')
AND sequence_order IN (1, 2);

-- Assign some tasks to technicians
UPDATE entity_tasks
SET assigned_to_id = (SELECT user_id FROM profiles WHERE role = 'technician' ORDER BY created_at LIMIT 1)
WHERE entity_type = 'service_ticket'
AND entity_id = (SELECT id FROM service_tickets WHERE ticket_number = 'SV-2025-002')
AND sequence_order = 1;

UPDATE entity_tasks
SET assigned_to_id = (SELECT user_id FROM profiles WHERE role = 'technician' ORDER BY created_at OFFSET 1 LIMIT 1)
WHERE entity_type = 'service_ticket'
AND entity_id = (SELECT id FROM service_tickets WHERE ticket_number = 'SV-2025-003')
AND sequence_order = 1;

-- Leave some tasks unassigned for "Claim Available Task" scenario
UPDATE entity_tasks
SET assigned_to_id = NULL
WHERE entity_type = 'service_ticket'
AND sequence_order IN (3, 4);

RAISE NOTICE 'Task assignments updated for UAT';

-- ============================================
-- 8. Verify final setup
-- ============================================

SELECT
    'Service Tickets' as entity,
    COUNT(*) as count
FROM service_tickets
WHERE ticket_number LIKE 'SV-2025-%'

UNION ALL

SELECT
    'Entity Tasks' as entity,
    COUNT(*) as count
FROM entity_tasks

UNION ALL

SELECT
    'Assigned Tasks' as entity,
    COUNT(*) as count
FROM entity_tasks
WHERE assigned_to_id IS NOT NULL

UNION ALL

SELECT
    'Unassigned Tasks' as entity,
    COUNT(*) as count
FROM entity_tasks
WHERE assigned_to_id IS NULL

UNION ALL

SELECT
    'Overdue Tasks' as entity,
    COUNT(*) as count
FROM entity_tasks
WHERE due_date < NOW() AND status NOT IN ('completed', 'skipped');

-- ============================================
-- 9. Display task summary for QA verification
-- ============================================

SELECT
    st.ticket_number,
    et.name as task_name,
    et.status,
    et.sequence_order,
    CASE
        WHEN et.assigned_to_id IS NOT NULL THEN p.full_name
        ELSE 'Unassigned'
    END as assigned_to,
    CASE
        WHEN et.due_date < NOW() THEN 'OVERDUE'
        ELSE TO_CHAR(et.due_date, 'YYYY-MM-DD')
    END as due_date,
    et.is_required
FROM entity_tasks et
JOIN service_tickets st ON et.entity_id = st.id AND et.entity_type = 'service_ticket'
LEFT JOIN profiles p ON et.assigned_to_id = p.user_id
WHERE st.ticket_number IN ('SV-2025-001', 'SV-2025-002', 'SV-2025-003')
ORDER BY st.ticket_number, et.sequence_order;

-- ============================================
-- Setup complete!
-- ============================================

DO $$
BEGIN
    RAISE NOTICE '========================================';
    RAISE NOTICE 'UAT Sample Data Setup Complete!';
    RAISE NOTICE '========================================';
    RAISE NOTICE 'Tickets: 3 (SV-2025-001, SV-2025-002, SV-2025-003)';
    RAISE NOTICE 'Tasks: 8+ (various statuses)';
    RAISE NOTICE 'Users: Admin, Manager, Technicians';
    RAISE NOTICE 'Due dates: Relative to today';
    RAISE NOTICE '========================================';
    RAISE NOTICE 'Ready for UAT execution!';
    RAISE NOTICE '========================================';
END $$;
