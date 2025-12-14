-- =====================================================
-- 200_core_tables.sql
-- =====================================================
-- Core Business Tables
--
-- This file defines the foundational tables for:
-- - User profiles and authentication
-- - Customer management
-- - Product catalog (brands, products, parts)
--
-- ORDER: 200-299 (Tables)
-- DEPENDENCIES: 100_enums_and_sequences.sql, 150_base_functions.sql
-- =====================================================

-- =====================================================
-- PROFILES TABLE
-- =====================================================

CREATE TABLE "profiles" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "user_id" UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  "full_name" TEXT NOT NULL,
  "avatar_url" TEXT,
  "email" TEXT NOT NULL,
  "role" public.user_role NOT NULL DEFAULT 'technician',
  "is_active" BOOLEAN NOT NULL DEFAULT true,
  "created_at" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  "updated_at" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  "created_by" UUID REFERENCES "profiles"("user_id"),
  "updated_by" UUID REFERENCES "profiles"("user_id"),

  CONSTRAINT "profiles_pkey" PRIMARY KEY ("id")
);

-- Indexes
CREATE INDEX "profiles_user_id_idx" ON "profiles" USING btree ("user_id");
CREATE INDEX "profiles_email_idx" ON "profiles" USING btree ("email");
CREATE INDEX "profiles_role_idx" ON "profiles" USING btree ("role");
CREATE INDEX "profiles_is_active_idx" ON "profiles" USING btree ("is_active") WHERE is_active = true;

-- Triggers
CREATE TRIGGER "profiles_updated_at_trigger"
  BEFORE UPDATE ON "profiles"
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- RLS (Basic policies - will be updated in 800_core_rls_policies.sql)
ALTER TABLE "profiles" ENABLE ROW LEVEL SECURITY;
CREATE POLICY "profiles_select_policy" ON "profiles" FOR SELECT USING (true);
CREATE POLICY "profiles_insert_policy" ON "profiles" FOR INSERT WITH CHECK ((SELECT auth.uid()) = user_id OR public.is_admin());
CREATE POLICY "profiles_update_policy" ON "profiles" FOR UPDATE USING ((SELECT auth.uid()) = user_id OR public.is_admin());
CREATE POLICY "profiles_delete_policy" ON "profiles" FOR DELETE USING (public.is_admin());

-- =====================================================
-- CUSTOMERS TABLE
-- =====================================================

CREATE TABLE "customers" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "name" TEXT NOT NULL,
  "phone" TEXT NOT NULL UNIQUE,
  "email" TEXT,
  "address" TEXT,
  "notes" TEXT,
  "is_active" BOOLEAN NOT NULL DEFAULT true,
  "created_at" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  "updated_at" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  "created_by" UUID REFERENCES "profiles"("id"),
  "updated_by" UUID REFERENCES "profiles"("id"),

  CONSTRAINT "customers_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "customers_phone_unique" UNIQUE ("phone")
);

COMMENT ON CONSTRAINT "customers_phone_unique" ON "customers" IS 'Ensures one customer per phone number for reliable customer lookup and prevents duplicates';

-- Indexes
CREATE INDEX "customers_email_idx" ON "customers" USING btree ("email");
CREATE INDEX "customers_name_idx" ON "customers" USING btree ("name");
CREATE INDEX "customers_is_active_idx" ON "customers" USING btree ("is_active") WHERE is_active = true;

-- Triggers
CREATE TRIGGER "customers_updated_at_trigger"
  BEFORE UPDATE ON "customers"
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- RLS (Basic policies - will be updated in 800_core_rls_policies.sql)
ALTER TABLE "customers" ENABLE ROW LEVEL SECURITY;
CREATE POLICY "customers_select_policy" ON "customers" FOR SELECT USING (true);
CREATE POLICY "customers_insert_policy" ON "customers" FOR INSERT WITH CHECK (true);
CREATE POLICY "customers_update_policy" ON "customers" FOR UPDATE USING (true);
CREATE POLICY "customers_delete_policy" ON "customers" FOR DELETE USING (public.is_admin_or_manager());

-- =====================================================
-- BRANDS TABLE
-- =====================================================

CREATE TABLE "brands" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "name" TEXT NOT NULL UNIQUE,
  "description" TEXT,
  "is_active" BOOLEAN NOT NULL DEFAULT true,
  "created_at" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  "updated_at" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  "created_by" UUID REFERENCES "profiles"("user_id"),
  "updated_by" UUID REFERENCES "profiles"("user_id"),

  CONSTRAINT "brands_pkey" PRIMARY KEY ("id")
);

-- Indexes
CREATE INDEX "brands_name_idx" ON "brands" USING btree ("name");
CREATE INDEX "brands_is_active_idx" ON "brands" USING btree ("is_active") WHERE is_active = true;

-- Triggers
CREATE TRIGGER "brands_updated_at_trigger"
  BEFORE UPDATE ON "brands"
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- RLS
ALTER TABLE "brands" ENABLE ROW LEVEL SECURITY;
CREATE POLICY "brands_select_policy" ON "brands" FOR SELECT USING (true);
CREATE POLICY "brands_insert_policy" ON "brands" FOR INSERT WITH CHECK (true);
CREATE POLICY "brands_update_policy" ON "brands" FOR UPDATE USING (true);
CREATE POLICY "brands_delete_policy" ON "brands" FOR DELETE USING (public.is_admin_or_manager());

-- =====================================================
-- PRODUCTS TABLE
-- =====================================================

CREATE TABLE "products" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "name" TEXT NOT NULL,
  "type" TEXT NOT NULL,
  "brand_id" UUID REFERENCES "brands"("id"),
  "model" TEXT,
  "sku" TEXT,
  "short_description" TEXT,
  "primary_image" TEXT,
  "warranty_period_months" INTEGER CHECK (warranty_period_months >= 0),
  "is_active" BOOLEAN NOT NULL DEFAULT true,
  "created_at" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  "updated_at" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  "created_by" UUID REFERENCES "profiles"("user_id"),
  "updated_by" UUID REFERENCES "profiles"("user_id"),

  CONSTRAINT "products_pkey" PRIMARY KEY ("id")
);

-- Indexes
CREATE INDEX "products_name_idx" ON "products" USING btree ("name");
CREATE INDEX "products_type_idx" ON "products" USING btree ("type");
CREATE INDEX "products_brand_id_idx" ON "products" USING btree ("brand_id");
CREATE INDEX "products_model_idx" ON "products" USING btree ("model");
CREATE INDEX "products_sku_idx" ON "products" USING btree ("sku");
CREATE INDEX "products_is_active_idx" ON "products" USING btree ("is_active") WHERE is_active = true;

-- Triggers
CREATE TRIGGER "products_updated_at_trigger"
  BEFORE UPDATE ON "products"
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- RLS
ALTER TABLE "products" ENABLE ROW LEVEL SECURITY;
CREATE POLICY "products_select_policy" ON "products" FOR SELECT USING (true);
CREATE POLICY "products_insert_policy" ON "products" FOR INSERT WITH CHECK (true);
CREATE POLICY "products_update_policy" ON "products" FOR UPDATE USING (true);
CREATE POLICY "products_delete_policy" ON "products" FOR DELETE USING (public.is_admin_or_manager());

-- =====================================================
-- PARTS TABLE
-- =====================================================

CREATE TABLE "parts" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "name" TEXT NOT NULL,
  "part_number" TEXT,
  "sku" TEXT,
  "description" TEXT,
  "category" TEXT,
  "price" DECIMAL(10,2) NOT NULL CHECK (price >= 0),
  "cost_price" DECIMAL(10,2) CHECK (cost_price >= 0),
  "stock_quantity" INTEGER NOT NULL DEFAULT 0 CHECK (stock_quantity >= 0),
  "min_stock_level" INTEGER DEFAULT 0 CHECK (min_stock_level >= 0),
  "supplier" TEXT,
  "image_url" TEXT,
  "is_active" BOOLEAN NOT NULL DEFAULT true,
  "created_at" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  "updated_at" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  "created_by" UUID REFERENCES "profiles"("user_id"),
  "updated_by" UUID REFERENCES "profiles"("user_id"),

  CONSTRAINT "parts_pkey" PRIMARY KEY ("id")
);

-- Indexes
CREATE INDEX "parts_name_idx" ON "parts" USING btree ("name");
CREATE INDEX "parts_part_number_idx" ON "parts" USING btree ("part_number");
CREATE INDEX "parts_sku_idx" ON "parts" USING btree ("sku");
CREATE INDEX "parts_category_idx" ON "parts" USING btree ("category");
CREATE INDEX "parts_stock_quantity_idx" ON "parts" USING btree ("stock_quantity");
CREATE INDEX "parts_is_active_idx" ON "parts" USING btree ("is_active") WHERE is_active = true;

-- Triggers
CREATE TRIGGER "parts_updated_at_trigger"
  BEFORE UPDATE ON "parts"
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- RLS
ALTER TABLE "parts" ENABLE ROW LEVEL SECURITY;
CREATE POLICY "parts_select_policy" ON "parts" FOR SELECT USING (true);
CREATE POLICY "parts_insert_policy" ON "parts" FOR INSERT WITH CHECK (true);
CREATE POLICY "parts_update_policy" ON "parts" FOR UPDATE USING (true);
CREATE POLICY "parts_delete_policy" ON "parts" FOR DELETE USING (public.is_admin_or_manager());

-- =====================================================
-- PRODUCT_PARTS JUNCTION TABLE
-- =====================================================

CREATE TABLE "product_parts" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "product_id" UUID NOT NULL REFERENCES "products"("id") ON DELETE CASCADE,
  "part_id" UUID NOT NULL REFERENCES "parts"("id") ON DELETE CASCADE,
  "quantity_per_unit" INTEGER NOT NULL DEFAULT 1 CHECK (quantity_per_unit > 0),
  "is_required" BOOLEAN NOT NULL DEFAULT false,
  "notes" TEXT,
  "created_at" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  "updated_at" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  "created_by" UUID REFERENCES "profiles"("user_id"),
  "updated_by" UUID REFERENCES "profiles"("user_id"),

  CONSTRAINT "product_parts_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "product_parts_unique" UNIQUE ("product_id", "part_id")
);

-- Indexes
CREATE INDEX "product_parts_product_id_idx" ON "product_parts" USING btree ("product_id");
CREATE INDEX "product_parts_part_id_idx" ON "product_parts" USING btree ("part_id");

-- Triggers
CREATE TRIGGER "product_parts_updated_at_trigger"
  BEFORE UPDATE ON "product_parts"
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- RLS
ALTER TABLE "product_parts" ENABLE ROW LEVEL SECURITY;
CREATE POLICY "product_parts_select_policy" ON "product_parts" FOR SELECT USING (true);
CREATE POLICY "product_parts_insert_policy" ON "product_parts" FOR INSERT WITH CHECK (true);
CREATE POLICY "product_parts_update_policy" ON "product_parts" FOR UPDATE USING (true);
CREATE POLICY "product_parts_delete_policy" ON "product_parts" FOR DELETE USING (true);
