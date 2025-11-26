-- =====================================================
-- 201_service_tickets.sql
-- =====================================================
-- Service Ticket Workflow Tables
--
-- Core tables for the service ticket management including:
-- - Service tickets with auto-numbering
-- - Parts usage tracking
-- - Comments and communication
-- - File attachments
--
-- ORDER: 200-299 (Tables)
-- DEPENDENCIES: 100, 150, 200
-- =====================================================

-- =====================================================
-- SERVICE_TICKETS TABLE
-- =====================================================

CREATE TABLE "service_tickets" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "ticket_number" TEXT NOT NULL UNIQUE,
  "customer_id" UUID NOT NULL REFERENCES "customers"("id"),
  "product_id" UUID NOT NULL REFERENCES "products"("id"),

  "serial_number" TEXT,
  "issue_description" TEXT NOT NULL,
  "status" public.ticket_status NOT NULL DEFAULT 'pending',
  "priority_level" public.priority_level NOT NULL DEFAULT 'normal',
  "warranty_type" public.warranty_type,
  "assigned_to" UUID REFERENCES "profiles"("id"),
  "service_fee" DECIMAL(10,2) NOT NULL DEFAULT 0 CHECK (service_fee >= 0),
  "diagnosis_fee" DECIMAL(10,2) NOT NULL DEFAULT 0 CHECK (diagnosis_fee >= 0),
  "parts_total" DECIMAL(10,2) NOT NULL DEFAULT 0 CHECK (parts_total >= 0),
  "discount_amount" DECIMAL(10,2) NOT NULL DEFAULT 0 CHECK (discount_amount >= 0),
  "total_cost" DECIMAL(10,2) GENERATED ALWAYS AS (service_fee + diagnosis_fee + parts_total - discount_amount) STORED,
  "started_at" TIMESTAMPTZ,
  "completed_at" TIMESTAMPTZ,
  "notes" TEXT,
  "created_at" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  "updated_at" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  "created_by" UUID REFERENCES "profiles"("id"),
  "updated_by" UUID REFERENCES "profiles"("id"),

  -- Phase 2 columns (FK constraints added in 301_foreign_key_constraints.sql)
  "workflow_id" UUID,
  "request_id" UUID,
  "delivery_method" public.delivery_method,
  "delivery_address" TEXT,
  "delivery_confirmed_at" TIMESTAMPTZ,
  "delivery_confirmed_by_id" UUID REFERENCES "profiles"("id"),

  CONSTRAINT "service_tickets_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "service_tickets_dates_check" CHECK (completed_at IS NULL OR started_at IS NULL OR completed_at >= started_at),
  CONSTRAINT "service_tickets_delivery_requires_address" CHECK (delivery_method != 'delivery' OR delivery_address IS NOT NULL)
);

COMMENT ON COLUMN public.service_tickets.workflow_id IS 'Workflow template used for task execution (Phase 2)';
COMMENT ON COLUMN public.service_tickets.request_id IS 'Service request that created this ticket (Phase 2)';
COMMENT ON COLUMN public.service_tickets.delivery_method IS 'Customer delivery preference: pickup or delivery (Phase 2)';
COMMENT ON COLUMN public.service_tickets.delivery_address IS 'Delivery address if delivery_method = delivery (Phase 2)';

COMMENT ON COLUMN public.service_tickets.serial_number IS 'Captured serial number for the product at ticket creation time';
COMMENT ON COLUMN public.service_tickets.delivery_confirmed_at IS 'Timestamp when delivery to customer was confirmed';
COMMENT ON COLUMN public.service_tickets.delivery_confirmed_by_id IS 'profiles.id of staff who confirmed delivery';

-- Indexes
CREATE INDEX "service_tickets_ticket_number_idx" ON "service_tickets" USING btree ("ticket_number");
CREATE INDEX "service_tickets_customer_id_idx" ON "service_tickets" USING btree ("customer_id");
CREATE INDEX "service_tickets_product_id_idx" ON "service_tickets" USING btree ("product_id");

CREATE INDEX IF NOT EXISTS idx_service_tickets_serial_number ON public.service_tickets(serial_number) WHERE serial_number IS NOT NULL;
CREATE INDEX "service_tickets_status_idx" ON "service_tickets" USING btree ("status");
CREATE INDEX "service_tickets_priority_level_idx" ON "service_tickets" USING btree ("priority_level");
CREATE INDEX "service_tickets_assigned_to_idx" ON "service_tickets" USING btree ("assigned_to");
CREATE INDEX "service_tickets_created_at_idx" ON "service_tickets" USING btree ("created_at");
CREATE INDEX "service_tickets_status_created_at_idx" ON "service_tickets" USING btree ("status", "created_at");
CREATE INDEX IF NOT EXISTS idx_service_tickets_workflow ON public.service_tickets(workflow_id) WHERE workflow_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_service_tickets_request ON public.service_tickets(request_id) WHERE request_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_service_tickets_delivery_method ON public.service_tickets(delivery_method) WHERE delivery_method IS NOT NULL;

-- Triggers
CREATE TRIGGER "service_tickets_updated_at_trigger"
  BEFORE UPDATE ON "service_tickets"
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- TICKET NUMBER GENERATION
-- =====================================================

CREATE OR REPLACE FUNCTION public.generate_ticket_number()
RETURNS TEXT LANGUAGE plpgsql SECURITY DEFINER SET search_path = '' AS $$
DECLARE
  current_year TEXT;
  next_number INTEGER;
  new_ticket_number TEXT;
BEGIN
  current_year := to_char(now(), 'YYYY');
  SELECT coalesce(max((regexp_match(ticket_number, 'SV-' || current_year || '-(\d+)'))[1]::integer), 0) + 1
  INTO next_number
  FROM public.service_tickets
  WHERE ticket_number ~ ('SV-' || current_year || '-\d+');
  new_ticket_number := 'SV-' || current_year || '-' || lpad(next_number::text, 3, '0');
  RETURN new_ticket_number;
END;
$$;

CREATE OR REPLACE FUNCTION public.set_ticket_number()
RETURNS TRIGGER AS $$
BEGIN
  IF new.ticket_number IS NULL OR new.ticket_number = '' THEN
    new.ticket_number := public.generate_ticket_number();
  END IF;
  RETURN new;
END;
$$ LANGUAGE plpgsql SET search_path = '';

CREATE TRIGGER "service_tickets_set_number_trigger"
  BEFORE INSERT ON "service_tickets"
  FOR EACH ROW
  EXECUTE FUNCTION set_ticket_number();

-- =====================================================
-- STATUS CHANGE LOGGING
-- =====================================================

CREATE OR REPLACE FUNCTION public.log_status_change()
RETURNS TRIGGER AS $$
DECLARE
  profile_id_var UUID;
BEGIN
  IF (tg_op = 'UPDATE' AND old.status IS DISTINCT FROM new.status) THEN
    -- Use updated_by if available, otherwise lookup profile from auth.uid()
    IF new.updated_by IS NOT NULL THEN
      profile_id_var := new.updated_by;
    ELSE
      -- Lookup profile.id from auth.uid() (auth.users.id)
      SELECT id INTO profile_id_var
      FROM public.profiles
      WHERE user_id = auth.uid();
    END IF;

    INSERT INTO public.service_ticket_comments (ticket_id, comment, comment_type, is_internal, created_by)
    VALUES (new.id, 'Status changed from "' || old.status || '" to "' || new.status || '"', 'status_change', false, profile_id_var);
  END IF;
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = '';

CREATE TRIGGER "service_tickets_log_status_change_trigger"
  AFTER UPDATE ON "service_tickets"
  FOR EACH ROW
  EXECUTE FUNCTION log_status_change();

-- RLS (Basic policies - will be updated in 800_core_rls_policies.sql)
ALTER TABLE "service_tickets" ENABLE ROW LEVEL SECURITY;
CREATE POLICY "service_tickets_select_policy" ON "service_tickets" FOR SELECT USING (true);
CREATE POLICY "service_tickets_insert_policy" ON "service_tickets" FOR INSERT WITH CHECK (true);
CREATE POLICY "service_tickets_update_policy" ON "service_tickets" FOR UPDATE USING (true);
CREATE POLICY "service_tickets_delete_policy" ON "service_tickets" FOR DELETE USING (public.is_admin_or_manager());

-- =====================================================
-- AUTO-CREATE TASKS WHEN TICKET HAS WORKFLOW (AUTO-GENERATED TICKETS)
-- Only runs for tickets linked to a service request (request_id IS NOT NULL)
-- to avoid duplicating tasks for manual ticket creation (handled in app layer).
-- =====================================================
CREATE OR REPLACE FUNCTION public.auto_create_service_ticket_tasks()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_existing INT;
BEGIN
  -- Only handle tickets created from service requests to avoid duplicating
  -- tasks for manual ticket creation where tasks are created in app layer.
  IF NEW.request_id IS NULL OR NEW.workflow_id IS NULL THEN
    RETURN NEW;
  END IF;

  SELECT COUNT(*) INTO v_existing
  FROM public.entity_tasks
  WHERE entity_type = 'service_ticket'
    AND entity_id = NEW.id;

  IF v_existing > 0 THEN
    RETURN NEW;
  END IF;

  INSERT INTO public.entity_tasks (
    entity_type,
    entity_id,
    task_id,
    workflow_task_id,
    workflow_id,
    name,
    description,
    sequence_order,
    status,
    is_required,
    estimated_duration_minutes,
    created_by_id
  )
  SELECT
    'service_ticket',
    NEW.id,
    wt.task_id,
    wt.id,
    wt.workflow_id,
    t.name,
    COALESCE(wt.custom_instructions, t.description),
    wt.sequence_order,
    'pending',
    wt.is_required,
    t.estimated_duration_minutes,
    NEW.created_by
  FROM public.workflow_tasks wt
  INNER JOIN public.tasks t ON t.id = wt.task_id
  WHERE wt.workflow_id = NEW.workflow_id
  ORDER BY wt.sequence_order;

  RETURN NEW;
EXCEPTION WHEN OTHERS THEN
  RAISE WARNING 'auto_create_service_ticket_tasks failed for ticket %: %', NEW.id, SQLERRM;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trigger_auto_create_service_ticket_tasks ON public.service_tickets;
CREATE TRIGGER trigger_auto_create_service_ticket_tasks
AFTER INSERT ON public.service_tickets
FOR EACH ROW
WHEN (NEW.workflow_id IS NOT NULL AND NEW.request_id IS NOT NULL)
EXECUTE FUNCTION public.auto_create_service_ticket_tasks();

-- =====================================================
-- SERVICE_TICKET_PARTS TABLE
-- =====================================================

CREATE TABLE "service_ticket_parts" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "ticket_id" UUID NOT NULL REFERENCES "service_tickets"("id") ON DELETE CASCADE,
  "part_id" UUID NOT NULL REFERENCES "parts"("id"),
  "quantity" INTEGER NOT NULL CHECK (quantity > 0),
  "unit_price" DECIMAL(10,2) NOT NULL CHECK (unit_price >= 0),
  "total_price" DECIMAL(10,2) GENERATED ALWAYS AS (quantity * unit_price) STORED,
  "notes" TEXT,
  "created_at" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  "updated_at" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  "created_by" UUID REFERENCES "profiles"("id"),
  "updated_by" UUID REFERENCES "profiles"("id"),

  CONSTRAINT "service_ticket_parts_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "service_ticket_parts_unique" UNIQUE ("ticket_id", "part_id")
);

-- Indexes
CREATE INDEX "service_ticket_parts_ticket_id_idx" ON "service_ticket_parts" USING btree ("ticket_id");
CREATE INDEX "service_ticket_parts_part_id_idx" ON "service_ticket_parts" USING btree ("part_id");

-- Triggers
CREATE TRIGGER "service_ticket_parts_updated_at_trigger"
  BEFORE UPDATE ON "service_ticket_parts"
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Update parts total on service_tickets
CREATE OR REPLACE FUNCTION public.update_service_ticket_parts_total()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE public.service_tickets
  SET parts_total = (
    SELECT coalesce(sum(total_price), 0)
    FROM public.service_ticket_parts
    WHERE ticket_id = coalesce(new.ticket_id, old.ticket_id)
  )
  WHERE id = coalesce(new.ticket_id, old.ticket_id);
  RETURN coalesce(new, old);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = '';

CREATE TRIGGER "service_ticket_parts_total_trigger"
  AFTER INSERT OR UPDATE OR DELETE ON "service_ticket_parts"
  FOR EACH ROW
  EXECUTE FUNCTION update_service_ticket_parts_total();

-- RLS (Basic policies - will be updated in 800_core_rls_policies.sql)
ALTER TABLE "service_ticket_parts" ENABLE ROW LEVEL SECURITY;
CREATE POLICY "service_ticket_parts_select_policy" ON "service_ticket_parts" FOR SELECT USING (true);
CREATE POLICY "service_ticket_parts_insert_policy" ON "service_ticket_parts" FOR INSERT WITH CHECK (true);
CREATE POLICY "service_ticket_parts_update_policy" ON "service_ticket_parts" FOR UPDATE USING (true);
CREATE POLICY "service_ticket_parts_delete_policy" ON "service_ticket_parts" FOR DELETE USING (true);

-- =====================================================
-- SERVICE_TICKET_COMMENTS TABLE
-- =====================================================

CREATE TABLE "service_ticket_comments" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "ticket_id" UUID NOT NULL REFERENCES "service_tickets"("id") ON DELETE CASCADE,
  "comment" TEXT NOT NULL,
  "comment_type" public.comment_type NOT NULL DEFAULT 'note',
  "is_internal" BOOLEAN NOT NULL DEFAULT false,
  "created_at" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  "updated_at" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  "created_by" UUID REFERENCES "profiles"("id"),
  "updated_by" UUID REFERENCES "profiles"("id"),

  CONSTRAINT "service_ticket_comments_pkey" PRIMARY KEY ("id")
);

-- Indexes
CREATE INDEX "service_ticket_comments_ticket_id_idx" ON "service_ticket_comments" USING btree ("ticket_id");
CREATE INDEX "service_ticket_comments_created_by_idx" ON "service_ticket_comments" USING btree ("created_by");
CREATE INDEX "service_ticket_comments_created_at_idx" ON "service_ticket_comments" USING btree ("created_at");

-- Triggers
CREATE TRIGGER "service_ticket_comments_updated_at_trigger"
  BEFORE UPDATE ON "service_ticket_comments"
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- RLS (Basic policies - will be updated in 800_core_rls_policies.sql)
ALTER TABLE "service_ticket_comments" ENABLE ROW LEVEL SECURITY;
CREATE POLICY "service_ticket_comments_select_policy" ON "service_ticket_comments" FOR SELECT USING (true);
CREATE POLICY "service_ticket_comments_insert_policy" ON "service_ticket_comments" FOR INSERT WITH CHECK ((SELECT auth.uid()) = created_by);
CREATE POLICY "service_ticket_comments_update_policy" ON "service_ticket_comments" FOR UPDATE USING (((SELECT auth.uid()) = created_by AND is_internal = false) OR public.is_admin_or_manager());
CREATE POLICY "service_ticket_comments_delete_policy" ON "service_ticket_comments" FOR DELETE USING (((SELECT auth.uid()) = created_by AND is_internal = false) OR public.is_admin_or_manager());

-- View for comments with author info
CREATE OR REPLACE VIEW service_ticket_comments_with_author AS
SELECT
  c.id, c.ticket_id, c.comment, c.comment_type, c.is_internal, c.created_at, c.updated_at, c.created_by, c.updated_by,
  p.full_name AS author_name, p.email AS author_email, p.avatar_url AS author_avatar
FROM service_ticket_comments c
LEFT JOIN profiles p ON p.user_id = c.created_by
ORDER BY c.created_at DESC;

-- =====================================================
-- SERVICE_TICKET_ATTACHMENTS TABLE
-- =====================================================

CREATE TABLE "service_ticket_attachments" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "ticket_id" UUID NOT NULL REFERENCES "service_tickets"("id") ON DELETE CASCADE,
  "file_name" TEXT NOT NULL,
  "file_path" TEXT NOT NULL,
  "file_type" TEXT NOT NULL,
  "file_size" BIGINT NOT NULL,
  "description" TEXT,
  "created_at" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  "created_by" UUID REFERENCES "profiles"("id"),

  CONSTRAINT "service_ticket_attachments_pkey" PRIMARY KEY ("id")
);

-- Indexes
CREATE INDEX "service_ticket_attachments_ticket_id_idx" ON "service_ticket_attachments" USING btree ("ticket_id");
CREATE INDEX "service_ticket_attachments_created_at_idx" ON "service_ticket_attachments" USING btree ("created_at");

-- RLS (Basic policies - will be updated in 800_core_rls_policies.sql)
ALTER TABLE "service_ticket_attachments" ENABLE ROW LEVEL SECURITY;
CREATE POLICY "service_ticket_attachments_select_policy" ON "service_ticket_attachments" FOR SELECT USING (true);
CREATE POLICY "service_ticket_attachments_insert_policy" ON "service_ticket_attachments" FOR INSERT WITH CHECK (true);
CREATE POLICY "service_ticket_attachments_update_policy" ON "service_ticket_attachments" FOR UPDATE USING (true);
CREATE POLICY "service_ticket_attachments_delete_policy" ON "service_ticket_attachments" FOR DELETE USING (public.is_admin_or_manager());
