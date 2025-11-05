# Physical Products Schema Update - Virtual Warehouse Migration

**Date:** 2025-10-31
**Status:** ✅ Implemented & Tested
**Version:** 1.0

---

## 1. Tổng Quan Thay Đổi (Overview)

### Vấn đề ban đầu (Original Problem)
Người dùng không thể thêm số serial vào phiếu nhập (stock receipts) do thiết kế schema sai:
- **SAI**: Sản phẩm vật lý lưu theo `virtual_warehouse_type` (ENUM) - không linh hoạt
- **SAI**: Tham chiếu trực tiếp tới `physical_warehouse_id` - dư thừa
- **SAI**: Không có trường lưu kho ảo trước đó cho quản lý RMA

### Giải pháp (Solution)
Redesign schema để lưu sản phẩm vào **kho ảo cụ thể (virtual warehouse instance)** thay vì loại kho:
- ✅ Sử dụng `virtual_warehouse_id` (UUID) thay vì `virtual_warehouse_type` (ENUM)
- ✅ Loại bỏ `physical_warehouse_id` trực tiếp (lấy từ `virtual_warehouse.physical_warehouse_id`)
- ✅ Thêm `previous_virtual_warehouse_id` để hỗ trợ quản lý RMA batch

---

## 2. Schema Changes

### 2.1 Bảng `physical_products`

#### Trước (Old Schema)
```sql
CREATE TABLE public.physical_products (
  id UUID PRIMARY KEY,
  product_id UUID NOT NULL,
  serial_number VARCHAR(255) NOT NULL UNIQUE,
  condition public.product_condition NOT NULL DEFAULT 'new',

  -- ❌ SAI: Lưu theo ENUM type
  virtual_warehouse_type public.warehouse_type NOT NULL,

  -- ❌ DƯ THỪA: Trực tiếp tham chiếu kho vật lý
  physical_warehouse_id UUID REFERENCES physical_warehouses(id),

  -- Các trường khác...
  manufacturer_warranty_end_date DATE,
  user_warranty_end_date DATE,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
```

#### Sau (New Schema)
```sql
CREATE TABLE public.physical_products (
  id UUID PRIMARY KEY,
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE RESTRICT,
  serial_number VARCHAR(255) NOT NULL UNIQUE,
  condition public.product_condition NOT NULL DEFAULT 'new',

  -- ✅ ĐÚNG: Lưu vào kho ảo instance cụ thể
  virtual_warehouse_id UUID NOT NULL
    REFERENCES virtual_warehouses(id) ON DELETE RESTRICT,

  -- ✅ MỚI: Lưu kho trước khi vào RMA để khôi phục
  previous_virtual_warehouse_id UUID
    REFERENCES virtual_warehouses(id) ON DELETE SET NULL,

  -- ❌ ĐÃ XÓA: Không cần physical_warehouse_id nữa
  -- physical_warehouse_id - Lấy từ virtual_warehouse.physical_warehouse_id

  -- Các trường khác không thay đổi...
  manufacturer_warranty_end_date DATE,
  user_warranty_end_date DATE,
  notes TEXT,
  rma_batch_id UUID REFERENCES rma_batches(id),
  current_ticket_id UUID REFERENCES service_tickets(id),
  last_known_customer_id UUID REFERENCES customers(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_physical_products_virtual_warehouse
  ON physical_products(virtual_warehouse_id);
CREATE INDEX idx_physical_products_previous_warehouse
  ON physical_products(previous_virtual_warehouse_id)
  WHERE previous_virtual_warehouse_id IS NOT NULL;
```

### 2.2 So Sánh Các Trường (Field Comparison)

| Trường | Old Schema | New Schema | Lý do |
|--------|-----------|-----------|--------|
| `virtual_warehouse_type` | ✅ ENUM NOT NULL | ❌ Đã xóa | Giới hạn linh hoạt, không tham chiếu được |
| `virtual_warehouse_id` | ❌ Không có | ✅ UUID NOT NULL | Tham chiếu kho ảo cụ thể, linh hoạt |
| `physical_warehouse_id` | ✅ UUID Nullable | ❌ Đã xóa | Dư thừa - lấy từ virtual_warehouse |
| `previous_virtual_warehouse_id` | ❌ Không có | ✅ UUID Nullable | Hỗ trợ RMA batch management |

---

## 3. Lợi Ích Của Thiết Kế Mới (Benefits)

### 3.1 Linh Hoạt (Flexibility)
```
Trước (Old):
  Công ty (Physical Warehouse)
    ├── warranty_stock (1 kho duy nhất - ENUM)
    ├── rma_staging (1 kho duy nhất - ENUM)
    └── parts (1 kho duy nhất - ENUM)

Sau (New):
  Công ty (Physical Warehouse)
    ├── Kho Bảo Hành Tầng 1 (warranty_stock instance #1) [UUID]
    ├── Kho Bảo Hành Tầng 2 (warranty_stock instance #2) [UUID]
    ├── Khu RMA A (rma_staging instance #1) [UUID]
    ├── Khu RMA B (rma_staging instance #2) [UUID]
    └── ... (Không giới hạn số lượng)
```

**Lợi ích:**
- ✅ Có thể tạo nhiều kho cùng loại trong 1 địa điểm vật lý
- ✅ Không cần sửa schema khi thêm kho mới
- ✅ Mỗi kho có thể cấu hình riêng (ngưỡng cảnh báo, mô tả...)

### 3.2 Tính Toàn Vẹn Dữ Liệu (Data Integrity)
```sql
-- ✅ Foreign key constraints hoạt động đúng
ALTER TABLE physical_products
  ADD CONSTRAINT fk_virtual_warehouse
  FOREIGN KEY (virtual_warehouse_id)
  REFERENCES virtual_warehouses(id) ON DELETE RESTRICT;

-- ✅ CASCADE deletes hoạt động chính xác
-- Nếu xóa virtual warehouse → ngăn chặn (RESTRICT) nếu còn hàng

-- ❌ KHÔNG THỂ với ENUM (Old schema)
-- ENUM không thể có foreign key constraint
```

### 3.3 Truy Vấn Dễ Dàng (Easier Queries)
```sql
-- Trước (Old): Không thể JOIN trực tiếp
SELECT pp.*, vw.name, pw.name
FROM physical_products pp
-- ❌ KHÔNG THỂ JOIN vì virtual_warehouse_type là ENUM
WHERE pp.virtual_warehouse_type = 'warranty_stock';

-- Sau (New): JOIN bình thường
SELECT
  pp.*,
  vw.name as virtual_warehouse_name,
  vw.warehouse_type,
  pw.name as physical_warehouse_name,
  pw.code as physical_warehouse_code
FROM physical_products pp
JOIN virtual_warehouses vw ON pp.virtual_warehouse_id = vw.id
JOIN physical_warehouses pw ON vw.physical_warehouse_id = pw.id
WHERE vw.warehouse_type = 'warranty_stock';
```

---

## 4. Migration Process

### 4.1 Các Bước Thực Hiện (Steps Executed)

#### Bước 1: Thêm cột mới
```sql
-- File: 19_add_virtual_warehouse_id_to_physical_products.sql
ALTER TABLE public.physical_products
  ADD COLUMN IF NOT EXISTS virtual_warehouse_id UUID
    REFERENCES public.virtual_warehouses(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_physical_products_virtual_warehouse
  ON public.physical_products(virtual_warehouse_id)
  WHERE virtual_warehouse_id IS NOT NULL;
```

#### Bước 2: Migrate dữ liệu
```sql
-- File: 20_refactor_physical_products_warehouse_fields.sql

-- 1. Thêm previous_virtual_warehouse_id
ALTER TABLE public.physical_products
  ADD COLUMN IF NOT EXISTS previous_virtual_warehouse_id UUID
    REFERENCES public.virtual_warehouses(id) ON DELETE SET NULL;

-- 2. Migrate dữ liệu từ enum sang UUID
UPDATE public.physical_products pp
SET virtual_warehouse_id = vw.id
FROM public.virtual_warehouses vw
WHERE vw.warehouse_type = pp.virtual_warehouse_type
  AND vw.is_default = true
  AND pp.virtual_warehouse_id IS NULL;

-- 3. Set default warehouse nếu còn NULL
UPDATE public.physical_products pp
SET virtual_warehouse_id = (
  SELECT id FROM public.virtual_warehouses
  WHERE is_default = true
  LIMIT 1
)
WHERE pp.virtual_warehouse_id IS NULL;

-- 4. Đặt NOT NULL constraint
ALTER TABLE public.physical_products
  ALTER COLUMN virtual_warehouse_id SET NOT NULL;

-- 5. Thay đổi ON DELETE từ SET NULL → RESTRICT
ALTER TABLE public.physical_products
  DROP CONSTRAINT IF EXISTS physical_products_virtual_warehouse_id_fkey;

ALTER TABLE public.physical_products
  ADD CONSTRAINT physical_products_virtual_warehouse_id_fkey
  FOREIGN KEY (virtual_warehouse_id)
  REFERENCES public.virtual_warehouses(id) ON DELETE RESTRICT;
```

#### Bước 3: Cập nhật views
```sql
-- File: 21_update_views_for_virtual_warehouse_id.sql

-- Drop và recreate các views
DROP VIEW IF EXISTS v_low_stock_alerts CASCADE;
DROP VIEW IF EXISTS v_warehouse_stock_levels CASCADE;
DROP VIEW IF EXISTS v_warranty_expiring_soon CASCADE;

-- Recreate với JOIN mới
CREATE OR REPLACE VIEW public.v_warehouse_stock_levels AS
SELECT
  p.id AS product_id,
  p.name AS product_name,
  vw.warehouse_type,  -- Lấy từ JOIN
  pp.condition,
  COUNT(*) AS quantity,
  -- ... các trường khác
FROM public.physical_products pp
JOIN public.products p ON pp.product_id = p.id
JOIN public.virtual_warehouses vw ON pp.virtual_warehouse_id = vw.id  -- ✅ JOIN mới
-- ...
```

#### Bước 4: Xóa cột cũ
```sql
-- Sau khi test kỹ, xóa cột cũ
ALTER TABLE public.physical_products
  DROP COLUMN IF EXISTS virtual_warehouse_type CASCADE;

ALTER TABLE public.physical_products
  DROP COLUMN IF EXISTS physical_warehouse_id CASCADE;
```

### 4.2 Files Created/Modified

#### Database Migrations
```bash
supabase/schemas/
├── 19_add_virtual_warehouse_id_to_physical_products.sql (NEW)
├── 20_refactor_physical_products_warehouse_fields.sql (NEW)
├── 21_update_views_for_virtual_warehouse_id.sql (NEW)
└── 22_v_stock_summary.sql (NEW)

supabase/migrations/
├── 20251031035829_init_schema.sql (UPDATED)
└── 20251031040652_add_inventory_stock_functions.sql (UPDATED)
```

#### Backend Routers
```bash
src/server/routers/
├── physical-products.ts (UPDATED)
│   └── Removed physical_warehouse_id from all operations
│   └── Updated JOINs to get physical warehouse from virtual_warehouse
│
├── inventory/
│   ├── stock.ts (UPDATED)
│   │   └── Fixed: virtual_warehouse_type → warehouse_type
│   ├── issues.ts (UPDATED)
│   │   └── Fixed: Get physical_warehouse_id through JOIN
│   └── serials.ts (UPDATED)
│       └── Removed physicalWarehouseId input parameter
│       └── Updated queries to JOIN through virtual_warehouse
```

#### Frontend Components
```bash
src/components/
├── modals/record-movement-modal.tsx (UPDATED)
│   └── Removed from_physical_warehouse_id reference
└── inventory/documents/
    ├── receipt-items-table.tsx (UPDATED - earlier fix)
    ├── issue-items-table.tsx (UPDATED - earlier fix)
    └── transfer-items-table.tsx (UPDATED - earlier fix)
```

#### Type Definitions
```bash
src/types/
├── database.types.ts (REGENERATED)
│   └── Now has virtual_warehouse_id, previous_virtual_warehouse_id
│   └── Removed virtual_warehouse_type, physical_warehouse_id
├── warehouse.ts (UPDATED)
│   └── PhysicalProductWithDetails interface updated
│   └── PhysicalProductFormData interface updated
└── inventory.ts (NO CHANGES NEEDED - already correct)
```

---

## 5. API Changes

### 5.1 Backend Router Changes

#### `physical-products.ts`
```typescript
// ❌ TRƯỚC: Có physical_warehouse_id
const createProductSchema = z.object({
  product_id: z.string().uuid(),
  serial_number: z.string().min(1),
  virtual_warehouse_id: z.string().uuid(),
  physical_warehouse_id: z.string().uuid().optional(),  // ❌ ĐÃ XÓA
  // ...
});

// ✅ SAU: Không còn physical_warehouse_id
const createProductSchema = z.object({
  product_id: z.string().uuid(),
  serial_number: z.string().min(1),
  virtual_warehouse_id: z.string().uuid(),  // ✅ Chỉ cần virtual warehouse
  // ...
});

// ❌ TRƯỚC: Select cũ
.select(`
  *,
  physical_warehouse:physical_warehouses(id, name),
  virtual_warehouse:virtual_warehouses!virtual_warehouse_id(id, name)
`)

// ✅ SAU: Select mới với nested JOIN
.select(`
  *,
  virtual_warehouse:virtual_warehouses!virtual_warehouse_id(
    id,
    name,
    warehouse_type,
    physical_warehouse:physical_warehouses(id, name, code)
  )
`)
```

#### `inventory/stock.ts`
```typescript
// ❌ TRƯỚC: Field name sai
query = query.eq("virtual_warehouse_type", input.virtualWarehouseType);

// ✅ SAU: Field name đúng
query = query.eq("warehouse_type", input.virtualWarehouseType);
```

#### `inventory/serials.ts`
```typescript
// ❌ TRƯỚC: Input có physicalWarehouseId
searchSerials: publicProcedure.use(requireManagerOrAbove)
  .input(
    z.object({
      search: z.string().min(1),
      virtualWarehouseId: z.string().optional(),
      physicalWarehouseId: z.string().optional(),  // ❌ ĐÃ XÓA
    })
  )
  .query(async ({ ctx, input }) => {
    // ...
    if (input.physicalWarehouseId) {
      query = query.eq("physical_warehouse_id", input.physicalWarehouseId);  // ❌ SAI
    }
  });

// ✅ SAU: Không còn physicalWarehouseId
searchSerials: publicProcedure.use(requireManagerOrAbove)
  .input(
    z.object({
      search: z.string().min(1),
      virtualWarehouseId: z.string().optional(),  // ✅ Chỉ cần virtual warehouse
    })
  )
  .query(async ({ ctx, input }) => {
    let query = ctx.supabaseAdmin
      .from("physical_products")
      .select(`
        *,
        virtual_warehouse:virtual_warehouses(
          id, name, warehouse_type,
          physical_warehouse:physical_warehouses(id, name)  // ✅ Lấy từ JOIN
        )
      `);
    // ...
  });
```

### 5.2 Database View Changes

#### v_stock_summary (NEW)
```sql
CREATE OR REPLACE VIEW public.v_stock_summary AS
SELECT
  pws.product_id,
  p.name AS product_name,
  p.sku,

  -- ✅ Virtual warehouse fields
  vw.id AS virtual_warehouse_id,
  vw.name AS virtual_warehouse_name,
  vw.warehouse_type,

  -- ✅ Physical warehouse từ JOIN
  pw.id AS physical_warehouse_id,
  pw.name AS physical_warehouse_name,

  -- Stock counts
  pws.declared_quantity,
  COALESCE(
    (SELECT COUNT(*)::INTEGER FROM physical_products pp
     WHERE pp.product_id = pws.product_id
       AND pp.virtual_warehouse_id = pws.virtual_warehouse_id),
    0
  ) AS actual_serial_count,
  -- ...
FROM product_warehouse_stock pws
JOIN products p ON pws.product_id = p.id
JOIN virtual_warehouses vw ON pws.virtual_warehouse_id = vw.id  -- ✅ JOIN
JOIN physical_warehouses pw ON vw.physical_warehouse_id = pw.id -- ✅ JOIN
-- ...
```

---

## 6. Testing & Verification

### 6.1 Build Test
```bash
$ pnpm build

✓ Compiled successfully in 10.3s
✓ Generating static pages (16/16)
✓ Finalizing page optimization
✓ Build completed successfully
```

### 6.2 Type Safety Check
```bash
# Regenerate database types
$ pnpx supabase gen types typescript --local > src/types/database.types.ts

# Verify physical_products type
physical_products: {
  Row: {
    id: string
    product_id: string
    serial_number: string
    virtual_warehouse_id: string  // ✅ Có
    previous_virtual_warehouse_id: string | null  // ✅ Có
    // ❌ Không còn: virtual_warehouse_type
    // ❌ Không còn: physical_warehouse_id
    // ...
  }
}
```

### 6.3 Runtime Verification
- ✅ Can add serials to receipts (original issue fixed)
- ✅ Virtual warehouse dropdown works
- ✅ Stock summary displays correctly
- ✅ Physical warehouse info shown via JOIN
- ✅ No TypeScript errors
- ✅ No runtime errors

---

## 7. Rollback Plan (Nếu Cần)

### Trong trường hợp cần rollback:

```sql
-- 1. Add back old columns
ALTER TABLE physical_products
  ADD COLUMN virtual_warehouse_type public.warehouse_type;

-- 2. Migrate data back
UPDATE physical_products pp
SET virtual_warehouse_type = vw.warehouse_type
FROM virtual_warehouses vw
WHERE pp.virtual_warehouse_id = vw.id;

-- 3. Set NOT NULL
ALTER TABLE physical_products
  ALTER COLUMN virtual_warehouse_type SET NOT NULL;

-- 4. Restore old views
-- (Run old view creation scripts)
```

**Lưu ý:** Không khuyến nghị rollback vì thiết kế mới tốt hơn nhiều.

---

## 8. Breaking Changes

### 8.1 API Breaking Changes
| API Endpoint | Change | Impact |
|-------------|--------|--------|
| `physicalProducts.create` | Removed `physical_warehouse_id` input | ❌ Breaking |
| `physicalProducts.update` | Removed `physical_warehouse_id` input | ❌ Breaking |
| `physicalProducts.list` | Removed `physical_warehouse_id` filter | ❌ Breaking |
| `inventory.serials.searchSerials` | Removed `physicalWarehouseId` input | ❌ Breaking |
| `inventory.serials.getSerialsByProduct` | Removed `physicalWarehouseId` input | ❌ Breaking |

### 8.2 Database Breaking Changes
- ❌ `physical_products.virtual_warehouse_type` column removed
- ❌ `physical_products.physical_warehouse_id` column removed
- ✅ `physical_products.virtual_warehouse_id` column added (NOT NULL)
- ✅ `physical_products.previous_virtual_warehouse_id` column added (nullable)

### 8.3 View Breaking Changes
- ❌ Old views referencing removed columns will fail
- ✅ All views recreated with JOINs

---

## 9. Future Enhancements

### 9.1 Planned Features
- [ ] Bulk warehouse transfer by scanning
- [ ] Warehouse capacity management
- [ ] Auto-suggest warehouse based on product type
- [ ] Warehouse performance analytics

### 9.2 Possible Improvements
- [ ] Add `warehouse_section` for sub-zones (e.g., "Tầng 1", "Kệ A")
- [ ] Add `bin_location` for exact positions (e.g., "A1-02-05")
- [ ] Track warehouse temperature/humidity conditions
- [ ] Integrate with physical barcode/RFID systems

---

## 10. Lessons Learned

### 10.1 Design Principles
✅ **DO:**
- Use UUIDs for entity references (not ENUMs)
- Keep foreign key relationships clean
- Create views for complex JOINs
- Test thoroughly before deploying

❌ **DON'T:**
- Use ENUMs for entity types that need referential integrity
- Store denormalized data when JOINs are fast
- Skip migration testing
- Make breaking changes without documentation

### 10.2 Migration Best Practices
1. **Add before remove** - Add new columns first, migrate data, then remove old
2. **Nullable first** - Add as nullable, populate, then set NOT NULL
3. **Test views** - Recreate all dependent views after schema changes
4. **Regenerate types** - Always regenerate TypeScript types after schema changes
5. **Run full build** - Verify with `pnpm build` before considering done

---

## 11. References

### Related Documents
- [Inventory Management Schema](./inventory-management-schema.md)
- [Inventory Workflow v2.0](./INVENTORY-WORKFLOW-V2.md)
- [Warranty Management](./WARRANTY-MANAGEMENT.md)
- [Default Warehouse System](./DEFAULT-WAREHOUSE-SYSTEM.md)

### Related Files
- **Schemas:** `docs/data/schemas/04_task_and_warehouse.sql`
- **Migrations:** `supabase/migrations/20251031035829_init_schema.sql`
- **Views:** `supabase/schemas/21_update_views_for_virtual_warehouse_id.sql`
- **Backend:** `src/server/routers/physical-products.ts`
- **Types:** `src/types/warehouse.ts`, `src/types/inventory.ts`

---

**Document Version:** 1.0
**Last Updated:** 2025-10-31
**Author:** Claude Code (with human guidance)
**Status:** ✅ Complete & Tested
