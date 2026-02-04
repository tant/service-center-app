# Kế hoạch đơn giản hóa hệ thống Quản lý Kho

> **Ngày tạo:** 2026-02-03
> **Trạng thái:** Sẵn sàng implement

## 1. Tổng quan

### 1.1 Mục tiêu
- Bỏ quy trình draft/duyệt phiếu → Phiếu có hiệu lực ngay khi tạo
- Đơn giản hóa `physical_product_status` từ 5 giá trị xuống 2 giá trị
- Giữ nguyên 3 loại phiếu: Nhập, Xuất, Chuyển (theo mô hình Odoo)
- Giảm số lượng triggers từ ~15 xuống ~5

### 1.2 Lý do thay đổi
- Quy trình draft/duyệt không cần thiết cho trung tâm bảo hành nhỏ-vừa
- Giảm độ phức tạp cho user và developer
- Tăng tốc độ xử lý (không cần chờ duyệt)

---

## 2. Thay đổi Schema

### 2.1 Enum Types

#### 2.1.1 `physical_product_status` (SỬA)

**Hiện tại:**
```sql
CREATE TYPE physical_product_status AS ENUM (
  'draft',        -- Từ phiếu nhập chưa duyệt
  'active',       -- Trong kho, sẵn sàng
  'transferring', -- Đang trong phiếu xuất/chuyển draft
  'issued',       -- Đã xuất
  'disposed'      -- Đã hủy
);
```

**Mới:**
```sql
CREATE TYPE physical_product_status AS ENUM (
  'active',   -- Sẵn sàng, có thể chọn
  'locked'    -- Bị khóa (dự phòng cho tương lai)
);
```

**Migration:**
```sql
-- Bước 1: Cập nhật dữ liệu hiện có
UPDATE physical_products SET status = 'active' WHERE status IN ('draft', 'active', 'transferring');
UPDATE physical_products SET status = 'active' WHERE status IN ('issued', 'disposed');
-- Lưu ý: issued/disposed nên được xác định qua virtual_warehouse_id

-- Bước 2: Tạo enum mới
ALTER TYPE physical_product_status RENAME TO physical_product_status_old;
CREATE TYPE physical_product_status AS ENUM ('active', 'locked');

-- Bước 3: Chuyển đổi column
ALTER TABLE physical_products
  ALTER COLUMN status TYPE physical_product_status
  USING 'active'::physical_product_status;

-- Bước 4: Xóa enum cũ
DROP TYPE physical_product_status_old;
```

#### 2.1.2 `stock_document_status` (SỬA)

**Hiện tại:**
```sql
CREATE TYPE stock_document_status AS ENUM (
  'draft',
  'pending_approval',
  'approved',
  'completed',
  'cancelled'
);
```

**Mới:**
```sql
CREATE TYPE stock_document_status AS ENUM (
  'completed'   -- Phiếu hoàn tất (mặc định và duy nhất)
);
```

**Migration:**
```sql
-- Cập nhật tất cả phiếu hiện có thành completed
UPDATE stock_receipts SET status = 'completed';
UPDATE stock_issues SET status = 'completed';

-- Tạo enum mới
ALTER TYPE stock_document_status RENAME TO stock_document_status_old;
CREATE TYPE stock_document_status AS ENUM ('completed');

-- Chuyển đổi columns
ALTER TABLE stock_receipts
  ALTER COLUMN status TYPE stock_document_status
  USING 'completed'::stock_document_status;

ALTER TABLE stock_issues
  ALTER COLUMN status TYPE stock_document_status
  USING 'completed'::stock_document_status;

DROP TYPE stock_document_status_old;
```

#### 2.1.3 `transfer_status` (SỬA)

**Hiện tại:**
```sql
CREATE TYPE transfer_status AS ENUM (
  'draft',
  'pending_approval',
  'approved',
  'completed',
  'cancelled'
);
```

**Mới:**
```sql
CREATE TYPE transfer_status AS ENUM (
  'completed'
);
```

---

### 2.2 Tables - Bỏ các trường không cần

#### 2.2.1 `stock_receipts`

**Bỏ các trường:**
```sql
ALTER TABLE stock_receipts DROP COLUMN IF EXISTS approved_by_id;
ALTER TABLE stock_receipts DROP COLUMN IF EXISTS approved_at;
ALTER TABLE stock_receipts DROP COLUMN IF EXISTS rejection_reason;
```

**Bỏ constraints:**
```sql
ALTER TABLE stock_receipts DROP CONSTRAINT IF EXISTS receipt_approved_requires_approver;
```

**Cập nhật default:**
```sql
ALTER TABLE stock_receipts ALTER COLUMN status SET DEFAULT 'completed';
```

#### 2.2.2 `stock_issues`

**Bỏ các trường:**
```sql
ALTER TABLE stock_issues DROP COLUMN IF EXISTS approved_by_id;
ALTER TABLE stock_issues DROP COLUMN IF EXISTS approved_at;
ALTER TABLE stock_issues DROP COLUMN IF EXISTS rejection_reason;
ALTER TABLE stock_issues DROP COLUMN IF EXISTS auto_approve_threshold;
```

**Bỏ constraints:**
```sql
ALTER TABLE stock_issues DROP CONSTRAINT IF EXISTS issue_approved_requires_approver;
```

**Cập nhật default:**
```sql
ALTER TABLE stock_issues ALTER COLUMN status SET DEFAULT 'completed';
```

#### 2.2.3 `stock_transfers`

**Bỏ các trường:**
```sql
ALTER TABLE stock_transfers DROP COLUMN IF EXISTS approved_by_id;
ALTER TABLE stock_transfers DROP COLUMN IF EXISTS approved_at;
ALTER TABLE stock_transfers DROP COLUMN IF EXISTS rejection_reason;
```

**Bỏ constraints:**
```sql
ALTER TABLE stock_transfers DROP CONSTRAINT IF EXISTS transfer_approved_requires_approver;
```

**Cập nhật default:**
```sql
ALTER TABLE stock_transfers ALTER COLUMN status SET DEFAULT 'completed';
```

---

## 3. Thay đổi Triggers

### 3.1 Triggers cần BỎ (10 triggers)

#### Receipt Triggers (4):
```sql
DROP TRIGGER IF EXISTS trigger_cleanup_draft_physical_product_on_serial_removal ON stock_receipt_serials;
DROP TRIGGER IF EXISTS trigger_cleanup_draft_physical_products_on_receipt_cancel ON stock_receipts;
DROP TRIGGER IF EXISTS trigger_update_stock_on_receipt_approval ON stock_receipts;
DROP TRIGGER IF EXISTS trigger_activate_physical_products_on_receipt_approval ON stock_receipts;
```

#### Issue Triggers (4):
```sql
DROP TRIGGER IF EXISTS trigger_restore_active_status_on_issue_serial_removal ON stock_issue_serials;
DROP TRIGGER IF EXISTS trigger_update_stock_on_issue_approval ON stock_issues;
DROP TRIGGER IF EXISTS trigger_mark_physical_products_as_issued_on_issue_approval ON stock_issues;
DROP TRIGGER IF EXISTS trigger_restore_active_status_on_issue_cancel ON stock_issues;
```

#### Transfer Triggers (5):
```sql
DROP TRIGGER IF EXISTS trigger_restore_active_status_on_transfer_serial_removal ON stock_transfer_serials;
DROP TRIGGER IF EXISTS trigger_update_stock_on_transfer_approval ON stock_transfers;
DROP TRIGGER IF EXISTS trigger_restore_active_status_on_transfer_approval ON stock_transfers;
DROP TRIGGER IF EXISTS trigger_restore_active_status_on_transfer_cancel ON stock_transfers;
```

#### Bỏ Functions tương ứng:
```sql
DROP FUNCTION IF EXISTS cleanup_draft_physical_product_on_serial_removal();
DROP FUNCTION IF EXISTS cleanup_draft_physical_products_on_receipt_cancel();
DROP FUNCTION IF EXISTS update_stock_on_receipt_approval();
DROP FUNCTION IF EXISTS activate_physical_products_on_receipt_approval();
DROP FUNCTION IF EXISTS restore_active_status_on_issue_serial_removal();
DROP FUNCTION IF EXISTS update_stock_on_issue_approval();
DROP FUNCTION IF EXISTS mark_physical_products_as_issued_on_issue_approval();
DROP FUNCTION IF EXISTS restore_active_status_on_issue_cancel();
DROP FUNCTION IF EXISTS mark_physical_product_as_transferring_on_issue();
DROP FUNCTION IF EXISTS restore_active_status_on_transfer_serial_removal();
DROP FUNCTION IF EXISTS update_stock_on_transfer_approval();
DROP FUNCTION IF EXISTS restore_active_status_on_transfer_approval();
DROP FUNCTION IF EXISTS restore_active_status_on_transfer_cancel();
DROP FUNCTION IF EXISTS mark_physical_product_as_transferring_on_transfer();
```

### 3.2 Triggers cần SỬA (3 triggers)

#### 3.2.1 Receipt Serial - Tạo physical product

**Tên mới:** `trigger_create_physical_product_on_receipt_serial`

**Logic mới:**
```sql
CREATE OR REPLACE FUNCTION public.create_physical_product_on_receipt_serial()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = ''
AS $$
DECLARE
  v_product_id UUID;
  v_virtual_warehouse_id UUID;
  v_physical_product_id UUID;
BEGIN
  -- Lấy thông tin từ receipt
  SELECT
    sri.product_id,
    sr.virtual_warehouse_id
  INTO
    v_product_id,
    v_virtual_warehouse_id
  FROM public.stock_receipt_items sri
  JOIN public.stock_receipts sr ON sri.receipt_id = sr.id
  WHERE sri.id = NEW.receipt_item_id;

  -- Tạo physical product với status='active' NGAY LẬP TỨC
  INSERT INTO public.physical_products (
    product_id,
    serial_number,
    virtual_warehouse_id,
    condition,
    status,
    manufacturer_warranty_end_date,
    user_warranty_end_date
  ) VALUES (
    v_product_id,
    NEW.serial_number,
    v_virtual_warehouse_id,
    'new',
    'active',  -- Luôn active, không còn draft
    NEW.manufacturer_warranty_end_date,
    NEW.user_warranty_end_date
  )
  RETURNING id INTO v_physical_product_id;

  -- Link serial với physical_product
  NEW.physical_product_id := v_physical_product_id;

  -- Cập nhật stock NGAY LẬP TỨC
  PERFORM public.upsert_product_stock(
    v_product_id,
    v_virtual_warehouse_id,
    1
  );

  RETURN NEW;
END;
$$;

-- Trigger
DROP TRIGGER IF EXISTS trigger_create_physical_product_from_receipt_serial ON stock_receipt_serials;
CREATE TRIGGER trigger_create_physical_product_on_receipt_serial
  BEFORE INSERT ON public.stock_receipt_serials
  FOR EACH ROW
  EXECUTE FUNCTION public.create_physical_product_on_receipt_serial();
```

#### 3.2.2 Issue Serial - Xuất kho ngay

**Tên mới:** `trigger_process_issue_serial`

**Logic mới:**
```sql
CREATE OR REPLACE FUNCTION public.process_issue_serial()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = ''
AS $$
DECLARE
  v_product_id UUID;
  v_from_warehouse_id UUID;
  v_to_warehouse_id UUID;
BEGIN
  -- Lấy thông tin từ issue
  SELECT
    sii.product_id,
    si.virtual_warehouse_id,
    si.to_virtual_warehouse_id
  INTO
    v_product_id,
    v_from_warehouse_id,
    v_to_warehouse_id
  FROM public.stock_issue_items sii
  JOIN public.stock_issues si ON sii.issue_id = si.id
  WHERE sii.id = NEW.issue_item_id;

  -- Chuyển physical product sang kho đích (nếu có) hoặc giữ nguyên
  UPDATE public.physical_products
  SET
    virtual_warehouse_id = COALESCE(v_to_warehouse_id, virtual_warehouse_id),
    updated_at = NOW()
  WHERE id = NEW.physical_product_id;

  -- Giảm stock kho nguồn
  PERFORM public.upsert_product_stock(
    v_product_id,
    v_from_warehouse_id,
    -1
  );

  -- Tăng stock kho đích (nếu có)
  IF v_to_warehouse_id IS NOT NULL THEN
    PERFORM public.upsert_product_stock(
      v_product_id,
      v_to_warehouse_id,
      1
    );
  END IF;

  RETURN NEW;
END;
$$;

-- Trigger
DROP TRIGGER IF EXISTS trigger_mark_physical_product_as_transferring_on_issue ON stock_issue_serials;
CREATE TRIGGER trigger_process_issue_serial
  AFTER INSERT ON public.stock_issue_serials
  FOR EACH ROW
  EXECUTE FUNCTION public.process_issue_serial();
```

#### 3.2.3 Transfer Serial - Chuyển kho ngay

**Tên mới:** `trigger_process_transfer_serial`

**Logic mới:**
```sql
CREATE OR REPLACE FUNCTION public.process_transfer_serial()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = ''
AS $$
DECLARE
  v_product_id UUID;
  v_from_warehouse_id UUID;
  v_to_warehouse_id UUID;
  v_customer_id UUID;
BEGIN
  -- Lấy thông tin từ transfer
  SELECT
    sti.product_id,
    st.from_virtual_warehouse_id,
    st.to_virtual_warehouse_id,
    st.customer_id
  INTO
    v_product_id,
    v_from_warehouse_id,
    v_to_warehouse_id,
    v_customer_id
  FROM public.stock_transfer_items sti
  JOIN public.stock_transfers st ON sti.transfer_id = st.id
  WHERE sti.id = NEW.transfer_item_id;

  -- Chuyển physical product sang kho đích
  UPDATE public.physical_products
  SET
    previous_virtual_warehouse_id = virtual_warehouse_id,
    virtual_warehouse_id = v_to_warehouse_id,
    last_known_customer_id = COALESCE(v_customer_id, last_known_customer_id),
    updated_at = NOW()
  WHERE id = NEW.physical_product_id;

  -- Giảm stock kho nguồn
  PERFORM public.upsert_product_stock(
    v_product_id,
    v_from_warehouse_id,
    -1
  );

  -- Tăng stock kho đích
  PERFORM public.upsert_product_stock(
    v_product_id,
    v_to_warehouse_id,
    1
  );

  RETURN NEW;
END;
$$;

-- Trigger
DROP TRIGGER IF EXISTS trigger_mark_physical_product_as_transferring_on_transfer ON stock_transfer_serials;
DROP TRIGGER IF EXISTS trigger_update_physical_product_warehouse_on_transfer ON stock_transfer_serials;
CREATE TRIGGER trigger_process_transfer_serial
  AFTER INSERT ON public.stock_transfer_serials
  FOR EACH ROW
  EXECUTE FUNCTION public.process_transfer_serial();
```

---

## 4. Thay đổi Code (tRPC Routers)

### 4.1 Files cần sửa

| File | Thay đổi |
|------|----------|
| `src/server/routers/stock-receipts.ts` | Bỏ logic approve, submit, cancel |
| `src/server/routers/stock-issues.ts` | Bỏ logic approve, submit, cancel |
| `src/server/routers/stock-transfers.ts` | Bỏ logic approve, submit, cancel |

### 4.2 Procedures cần BỎ

```typescript
// stock-receipts.ts
- submitForApproval
- approve
- reject
- cancel

// stock-issues.ts
- submitForApproval
- approve
- reject
- cancel

// stock-transfers.ts
- submitForApproval
- approve
- reject
- cancel
```

### 4.3 Procedures cần SỬA

```typescript
// Tất cả procedures create() không cần set status = 'draft'
// Status mặc định là 'completed'

// stock-receipts.ts
create: async ({ input }) => {
  return db.insert(stockReceipts).values({
    ...input,
    status: 'completed', // Mặc định
  });
}

// Tương tự cho stock-issues và stock-transfers
```

---

## 5. Thay đổi UI Components

### 5.1 Components cần SỬA

| Component | Thay đổi |
|-----------|----------|
| `StockReceiptForm` | Bỏ nút "Lưu nháp", "Gửi duyệt" |
| `StockReceiptDetail` | Bỏ nút "Duyệt", "Từ chối", "Hủy" |
| `StockIssueForm` | Bỏ nút "Lưu nháp", "Gửi duyệt" |
| `StockIssueDetail` | Bỏ nút "Duyệt", "Từ chối", "Hủy" |
| `StockTransferForm` | Bỏ nút "Lưu nháp", "Gửi duyệt" |
| `StockTransferDetail` | Bỏ nút "Duyệt", "Từ chối", "Hủy" |
| `StockDocumentsTable` | Bỏ filter theo status, bỏ cột status |

### 5.2 Luồng UI mới

#### Phiếu Nhập:
```
1. Nhấn "Tạo phiếu nhập"
2. Chọn kho đích, nhập thông tin
3. Thêm sản phẩm + số lượng
4. Nhập serial numbers
5. Nhấn "Hoàn tất" → Phiếu có hiệu lực ngay
```

#### Phiếu Xuất:
```
1. Nhấn "Tạo phiếu xuất"
2. Chọn kho nguồn, kho đích (archive)
3. Chọn khách hàng (nếu customer_installed)
4. Chọn serial numbers từ kho nguồn
5. Nhấn "Hoàn tất" → Serial chuyển kho ngay
```

#### Phiếu Chuyển:
```
1. Nhấn "Tạo phiếu chuyển"
2. Chọn kho nguồn, kho đích (non-archive)
3. Chọn serial numbers từ kho nguồn
4. Nhấn "Hoàn tất" → Serial chuyển kho ngay
```

---

## 6. Phân biệt Phiếu Xuất vs Phiếu Chuyển

### 6.1 Quy tắc phân loại theo kho đích

| Kho đích | Loại phiếu | Yêu cầu thêm |
|----------|------------|--------------|
| `customer_installed` | Xuất | **Bắt buộc** chọn customer |
| `dead_stock` | Xuất | Khuyến khích nhập lý do |
| `rma_staging` | Xuất | Có thể liên kết RMA batch |
| `main` | Chuyển | Không |
| `warranty_stock` | Chuyển | Không |
| `parts` | Chuyển | Không |
| `in_service` | Chuyển | Có thể liên kết ticket |

### 6.2 Validation

```typescript
// stock-issues validation
if (toWarehouseType === 'customer_installed' && !customerId) {
  throw new Error('Phải chọn khách hàng khi xuất cho khách');
}

// stock-transfers validation
if (isArchiveWarehouse(toWarehouseId)) {
  throw new Error('Phiếu chuyển không được chuyển đến kho archive. Sử dụng Phiếu xuất.');
}
```

---

## 7. Migration Script

### 7.1 File: `supabase/migrations/xxx_simplify_inventory.sql`

```sql
-- =====================================================
-- Migration: Simplify Inventory System
-- =====================================================

BEGIN;

-- =====================================================
-- STEP 1: Drop old triggers and functions
-- =====================================================

-- Receipt triggers
DROP TRIGGER IF EXISTS trigger_cleanup_draft_physical_product_on_serial_removal ON public.stock_receipt_serials;
DROP TRIGGER IF EXISTS trigger_cleanup_draft_physical_products_on_receipt_cancel ON public.stock_receipts;
DROP TRIGGER IF EXISTS trigger_update_stock_on_receipt_approval ON public.stock_receipts;
DROP TRIGGER IF EXISTS trigger_activate_physical_products_on_receipt_approval ON public.stock_receipts;
DROP TRIGGER IF EXISTS trigger_create_physical_product_from_receipt_serial ON public.stock_receipt_serials;

-- Issue triggers
DROP TRIGGER IF EXISTS trigger_mark_physical_product_as_transferring_on_issue ON public.stock_issue_serials;
DROP TRIGGER IF EXISTS trigger_restore_active_status_on_issue_serial_removal ON public.stock_issue_serials;
DROP TRIGGER IF EXISTS trigger_update_stock_on_issue_approval ON public.stock_issues;
DROP TRIGGER IF EXISTS trigger_mark_physical_products_as_issued_on_issue_approval ON public.stock_issues;
DROP TRIGGER IF EXISTS trigger_restore_active_status_on_issue_cancel ON public.stock_issues;

-- Transfer triggers
DROP TRIGGER IF EXISTS trigger_mark_physical_product_as_transferring_on_transfer ON public.stock_transfer_serials;
DROP TRIGGER IF EXISTS trigger_restore_active_status_on_transfer_serial_removal ON public.stock_transfer_serials;
DROP TRIGGER IF EXISTS trigger_update_physical_product_warehouse_on_transfer ON public.stock_transfer_serials;
DROP TRIGGER IF EXISTS trigger_update_stock_on_transfer_approval ON public.stock_transfers;
DROP TRIGGER IF EXISTS trigger_restore_active_status_on_transfer_approval ON public.stock_transfers;
DROP TRIGGER IF EXISTS trigger_restore_active_status_on_transfer_cancel ON public.stock_transfers;

-- Drop old functions
DROP FUNCTION IF EXISTS public.cleanup_draft_physical_product_on_serial_removal();
DROP FUNCTION IF EXISTS public.cleanup_draft_physical_products_on_receipt_cancel();
DROP FUNCTION IF EXISTS public.update_stock_on_receipt_approval();
DROP FUNCTION IF EXISTS public.activate_physical_products_on_receipt_approval();
DROP FUNCTION IF EXISTS public.create_physical_product_from_receipt_serial();
DROP FUNCTION IF EXISTS public.mark_physical_product_as_transferring_on_issue();
DROP FUNCTION IF EXISTS public.restore_active_status_on_issue_serial_removal();
DROP FUNCTION IF EXISTS public.update_stock_on_issue_approval();
DROP FUNCTION IF EXISTS public.mark_physical_products_as_issued_on_issue_approval();
DROP FUNCTION IF EXISTS public.restore_active_status_on_issue_cancel();
DROP FUNCTION IF EXISTS public.mark_physical_product_as_transferring_on_transfer();
DROP FUNCTION IF EXISTS public.restore_active_status_on_transfer_serial_removal();
DROP FUNCTION IF EXISTS public.update_physical_product_warehouse_on_transfer();
DROP FUNCTION IF EXISTS public.update_stock_on_transfer_approval();
DROP FUNCTION IF EXISTS public.restore_active_status_on_transfer_approval();
DROP FUNCTION IF EXISTS public.restore_active_status_on_transfer_cancel();

-- =====================================================
-- STEP 2: Update existing data
-- =====================================================

-- Update all physical products to 'active'
UPDATE public.physical_products
SET status = 'active'
WHERE status IN ('draft', 'transferring');

-- Update all documents to 'completed'
UPDATE public.stock_receipts SET status = 'completed' WHERE status != 'completed';
UPDATE public.stock_issues SET status = 'completed' WHERE status != 'completed';
UPDATE public.stock_transfers SET status = 'completed' WHERE status != 'completed';

-- =====================================================
-- STEP 3: Alter ENUM types
-- =====================================================

-- physical_product_status
ALTER TYPE public.physical_product_status RENAME TO physical_product_status_old;
CREATE TYPE public.physical_product_status AS ENUM ('active', 'locked');

ALTER TABLE public.physical_products
  ALTER COLUMN status DROP DEFAULT;
ALTER TABLE public.physical_products
  ALTER COLUMN status TYPE public.physical_product_status
  USING 'active'::public.physical_product_status;
ALTER TABLE public.physical_products
  ALTER COLUMN status SET DEFAULT 'active';

DROP TYPE public.physical_product_status_old;

-- stock_document_status
ALTER TYPE public.stock_document_status RENAME TO stock_document_status_old;
CREATE TYPE public.stock_document_status AS ENUM ('completed');

ALTER TABLE public.stock_receipts
  ALTER COLUMN status DROP DEFAULT;
ALTER TABLE public.stock_receipts
  ALTER COLUMN status TYPE public.stock_document_status
  USING 'completed'::public.stock_document_status;
ALTER TABLE public.stock_receipts
  ALTER COLUMN status SET DEFAULT 'completed';

ALTER TABLE public.stock_issues
  ALTER COLUMN status DROP DEFAULT;
ALTER TABLE public.stock_issues
  ALTER COLUMN status TYPE public.stock_document_status
  USING 'completed'::public.stock_document_status;
ALTER TABLE public.stock_issues
  ALTER COLUMN status SET DEFAULT 'completed';

DROP TYPE public.stock_document_status_old;

-- transfer_status
ALTER TYPE public.transfer_status RENAME TO transfer_status_old;
CREATE TYPE public.transfer_status AS ENUM ('completed');

ALTER TABLE public.stock_transfers
  ALTER COLUMN status DROP DEFAULT;
ALTER TABLE public.stock_transfers
  ALTER COLUMN status TYPE public.transfer_status
  USING 'completed'::public.transfer_status;
ALTER TABLE public.stock_transfers
  ALTER COLUMN status SET DEFAULT 'completed';

DROP TYPE public.transfer_status_old;

-- =====================================================
-- STEP 4: Drop unused columns
-- =====================================================

-- stock_receipts
ALTER TABLE public.stock_receipts DROP CONSTRAINT IF EXISTS receipt_approved_requires_approver;
ALTER TABLE public.stock_receipts DROP COLUMN IF EXISTS approved_by_id;
ALTER TABLE public.stock_receipts DROP COLUMN IF EXISTS approved_at;
ALTER TABLE public.stock_receipts DROP COLUMN IF EXISTS rejection_reason;

-- stock_issues
ALTER TABLE public.stock_issues DROP CONSTRAINT IF EXISTS issue_approved_requires_approver;
ALTER TABLE public.stock_issues DROP COLUMN IF EXISTS approved_by_id;
ALTER TABLE public.stock_issues DROP COLUMN IF EXISTS approved_at;
ALTER TABLE public.stock_issues DROP COLUMN IF EXISTS rejection_reason;
ALTER TABLE public.stock_issues DROP COLUMN IF EXISTS auto_approve_threshold;

-- stock_transfers
ALTER TABLE public.stock_transfers DROP CONSTRAINT IF EXISTS transfer_approved_requires_approver;
ALTER TABLE public.stock_transfers DROP COLUMN IF EXISTS approved_by_id;
ALTER TABLE public.stock_transfers DROP COLUMN IF EXISTS approved_at;
ALTER TABLE public.stock_transfers DROP COLUMN IF EXISTS rejection_reason;

-- =====================================================
-- STEP 5: Create new triggers
-- =====================================================

-- 5.1 Receipt Serial Trigger
CREATE OR REPLACE FUNCTION public.create_physical_product_on_receipt_serial()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = ''
AS $$
DECLARE
  v_product_id UUID;
  v_virtual_warehouse_id UUID;
  v_physical_product_id UUID;
BEGIN
  SELECT sri.product_id, sr.virtual_warehouse_id
  INTO v_product_id, v_virtual_warehouse_id
  FROM public.stock_receipt_items sri
  JOIN public.stock_receipts sr ON sri.receipt_id = sr.id
  WHERE sri.id = NEW.receipt_item_id;

  INSERT INTO public.physical_products (
    product_id, serial_number, virtual_warehouse_id,
    condition, status,
    manufacturer_warranty_end_date, user_warranty_end_date
  ) VALUES (
    v_product_id, NEW.serial_number, v_virtual_warehouse_id,
    'new', 'active',
    NEW.manufacturer_warranty_end_date, NEW.user_warranty_end_date
  )
  RETURNING id INTO v_physical_product_id;

  NEW.physical_product_id := v_physical_product_id;

  PERFORM public.upsert_product_stock(v_product_id, v_virtual_warehouse_id, 1);

  RETURN NEW;
END;
$$;

CREATE TRIGGER trigger_create_physical_product_on_receipt_serial
  BEFORE INSERT ON public.stock_receipt_serials
  FOR EACH ROW
  EXECUTE FUNCTION public.create_physical_product_on_receipt_serial();

-- 5.2 Issue Serial Trigger
CREATE OR REPLACE FUNCTION public.process_issue_serial()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = ''
AS $$
DECLARE
  v_product_id UUID;
  v_from_warehouse_id UUID;
  v_to_warehouse_id UUID;
BEGIN
  SELECT sii.product_id, si.virtual_warehouse_id, si.to_virtual_warehouse_id
  INTO v_product_id, v_from_warehouse_id, v_to_warehouse_id
  FROM public.stock_issue_items sii
  JOIN public.stock_issues si ON sii.issue_id = si.id
  WHERE sii.id = NEW.issue_item_id;

  UPDATE public.physical_products
  SET virtual_warehouse_id = COALESCE(v_to_warehouse_id, virtual_warehouse_id),
      updated_at = NOW()
  WHERE id = NEW.physical_product_id;

  PERFORM public.upsert_product_stock(v_product_id, v_from_warehouse_id, -1);

  IF v_to_warehouse_id IS NOT NULL THEN
    PERFORM public.upsert_product_stock(v_product_id, v_to_warehouse_id, 1);
  END IF;

  RETURN NEW;
END;
$$;

CREATE TRIGGER trigger_process_issue_serial
  AFTER INSERT ON public.stock_issue_serials
  FOR EACH ROW
  EXECUTE FUNCTION public.process_issue_serial();

-- 5.3 Transfer Serial Trigger
CREATE OR REPLACE FUNCTION public.process_transfer_serial()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = ''
AS $$
DECLARE
  v_product_id UUID;
  v_from_warehouse_id UUID;
  v_to_warehouse_id UUID;
  v_customer_id UUID;
BEGIN
  SELECT sti.product_id, st.from_virtual_warehouse_id,
         st.to_virtual_warehouse_id, st.customer_id
  INTO v_product_id, v_from_warehouse_id, v_to_warehouse_id, v_customer_id
  FROM public.stock_transfer_items sti
  JOIN public.stock_transfers st ON sti.transfer_id = st.id
  WHERE sti.id = NEW.transfer_item_id;

  UPDATE public.physical_products
  SET previous_virtual_warehouse_id = virtual_warehouse_id,
      virtual_warehouse_id = v_to_warehouse_id,
      last_known_customer_id = COALESCE(v_customer_id, last_known_customer_id),
      updated_at = NOW()
  WHERE id = NEW.physical_product_id;

  PERFORM public.upsert_product_stock(v_product_id, v_from_warehouse_id, -1);
  PERFORM public.upsert_product_stock(v_product_id, v_to_warehouse_id, 1);

  RETURN NEW;
END;
$$;

CREATE TRIGGER trigger_process_transfer_serial
  AFTER INSERT ON public.stock_transfer_serials
  FOR EACH ROW
  EXECUTE FUNCTION public.process_transfer_serial();

COMMIT;
```

---

## 8. Checklist triển khai

### Phase 1: Database
- [ ] Backup database hiện tại
- [ ] Chạy migration script trên môi trường test
- [ ] Verify dữ liệu sau migration
- [ ] Chạy migration trên production

### Phase 2: Backend (tRPC)
- [ ] Cập nhật `stock-receipts.ts` - bỏ procedures không cần
- [ ] Cập nhật `stock-issues.ts` - bỏ procedures không cần
- [ ] Cập nhật `stock-transfers.ts` - bỏ procedures không cần
- [ ] Cập nhật types/schemas nếu cần
- [ ] Test API endpoints

### Phase 3: Frontend
- [ ] Cập nhật StockReceiptForm - bỏ nút draft/submit
- [ ] Cập nhật StockReceiptDetail - bỏ nút approve/reject/cancel
- [ ] Cập nhật StockIssueForm
- [ ] Cập nhật StockIssueDetail
- [ ] Cập nhật StockTransferForm
- [ ] Cập nhật StockTransferDetail
- [ ] Cập nhật StockDocumentsTable - bỏ filter/column status
- [ ] Test UI flows

### Phase 4: Testing
- [ ] Test phiếu nhập: tạo → thêm serial → verify stock
- [ ] Test phiếu xuất: tạo → chọn serial → verify kho đích
- [ ] Test phiếu chuyển: tạo → chọn serial → verify chuyển kho
- [ ] Test edge cases

---

## 9. Rollback Plan

Nếu cần rollback:

1. Restore database từ backup
2. Revert code changes (git revert)
3. Deploy lại version cũ

---

## 10. Ghi chú

- **Không hỗ trợ hủy phiếu**: Phiếu đã tạo không thể hủy. Nếu sai, tạo phiếu điều chỉnh.
- **Dự phòng `locked` status**: Hiện chưa sử dụng, để dành cho tương lai (tranh chấp, recall...).
- **Phân biệt Xuất vs Chuyển**: Dựa trên kho đích (archive vs non-archive).