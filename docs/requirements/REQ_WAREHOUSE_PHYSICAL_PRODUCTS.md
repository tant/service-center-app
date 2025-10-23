# Requirements: Warehouse Management & Physical Products Tracking

**Feature ID:** REQ-WH-PP
**Version:** 1.0
**Date:** 2025-01-22
**Status:** Draft
**Priority:** P0 (Must Have)

---

## Table of Contents

1. [Business Context](#business-context)
2. [Functional Requirements](#functional-requirements)
3. [Data Model](#data-model)
4. [Business Rules](#business-rules)
5. [Workflows](#workflows)
6. [UI/UX Requirements](#uiux-requirements)
7. [Edge Cases](#edge-cases)

---

## Business Context

### Overview

SSTC Service Center cần quản lý:
- **Warehouse Operations:** Tồn kho sản phẩm và linh kiện cho service operations
- **Physical Products:** Track từng sản phẩm có serial number qua vòng đời
- **Warranty Management:** Two-tier warranty system (Company + Manufacturer)
- **RMA Lifecycle:** Quản lý sản phẩm hư gửi về nhà máy và nhận replacement

### Scope

**IN SCOPE:**
- ✅ Warehouse management (2-level: Physical → Virtual)
- ✅ Physical product tracking với serial numbers
- ✅ Stock movements cho service operations only
- ✅ Barcode scanning workflow
- ✅ Two-tier warranty tracking
- ✅ Replacement workflows (warranty/RMA)
- ✅ Parts inventory (simplified - consumption tracking)
- ✅ Low stock alerts

**OUT OF SCOPE (Phase 1):**
- ❌ Commercial sales inventory (mua/bán thương mại)
- ❌ Supplier management & purchase orders
- ❌ Multi-currency pricing
- ❌ Advanced warehouse features (bin locations, picking routes)
- ❌ Barcode printing/label generation

### Key Stakeholders

- **Warehouse Staff:** Xuất/nhập kho
- **Technicians:** Sử dụng parts, xuất replacement products
- **Managers:** Monitor stock levels, approve replacements
- **Customers:** (Indirect) Receive replacement products

---

## Functional Requirements

### FR-WH-001: Two-Level Warehouse Architecture

**Requirement:**
System phải support 2-level warehouse hierarchy: Physical Warehouses → Virtual Warehouses

**Rationale:**
- Physical warehouses = địa điểm vật lý (TP.HCM, Hà Nội)
- Virtual warehouses = phân loại theo workflow/status
- Mỗi virtual warehouse BẮT BUỘC thuộc 1 physical warehouse
- Stock items CHỈ nằm trong virtual warehouses

**Acceptance Criteria:**
- [ ] Admin có thể tạo physical warehouses (name, address)
- [ ] Admin có thể tạo virtual warehouses (name, purpose, parent physical warehouse)
- [ ] Mỗi virtual warehouse phải link to 1 physical warehouse
- [ ] Stock items assigned to virtual warehouse (implicit physical location)
- [ ] UI hiển thị hierarchy: Physical → Virtual → Stock items

**Business Value:** Flexible logistics management while tracking physical locations

---

### FR-WH-002: Virtual Warehouse Definitions

**Requirement:**
System phải có predefined virtual warehouses với mục đích rõ ràng

**Virtual Warehouse Types:**

1. **Kho Bảo Hành (Warranty Stock)**
   - Purpose: Sản phẩm mới cho customer replacements
   - Inbound: Hàng mới từ supplier, hàng return từ manufacturer RMA
   - Condition: new, refurbished
   - Priority: High (active stock)

2. **Kho RMA (RMA Staging)**
   - Purpose: Sản phẩm hư sẵn sàng ship về nhà máy
   - Outbound staging area
   - Temporary holding (days/weeks)
   - Purpose: Batch shipments to manufacturer

3. **Kho Hàng Hư Hỏng (Dead Stock / Salvage)**
   - Purpose: Sản phẩm hết bảo hành, không RMA được
   - Long-term storage
   - Future use: Parts harvesting
   - Priority: Low (inactive)

4. **Kho Linh Kiện (Parts Inventory)**
   - Purpose: Linh kiện cho repairs
   - Track: Consumption only (no stock alerts needed)
   - Treatment: Unlimited availability assumption

5. **Kho Tạm / Đang Dịch Vụ (In-Service)**
   - Purpose: Sản phẩm đang được service
   - Temporary status
   - Chờ chẩn đoán, chờ quyết định

**Acceptance Criteria:**
- [ ] System preconfigured với 5 virtual warehouses trên
- [ ] Admin có thể add thêm virtual warehouses
- [ ] Each type có description và purpose rõ ràng
- [ ] Stock movements respect warehouse purposes

**Business Value:** Clear organization, standardized workflows

---

### FR-WH-003: Physical Product Master Data

**Requirement:**
Mỗi physical product (có serial number) phải có complete master record

**Required Fields:**
- `serial_number` (VARCHAR, unique, NOT NULL) - Primary identifier
- `product_id` (FK → products table) - Link to product catalog
- `brand` (VARCHAR) - ZOTAC, SSTC
- `import_date` (DATE, NOT NULL) - Ngày nhập khẩu/nhập kho
- `manufacturer_warranty_end_date` (DATE, nullable) - Manual input
- `company_warranty_end_date` (DATE, nullable) - Manual input
- `current_location_id` (FK → virtual_warehouses, nullable)
- `condition` (ENUM: new, refurbished, faulty, in_service, out_for_rma)
- `created_at`, `updated_at` (audit trail)

**Optional Fields:**
- `sale_date` (DATE, nullable) - Ngày bán cho customer
- `customer_id` (FK → customers, nullable) - Nếu đã bán
- `supplier_info` (TEXT, nullable)
- `purchase_order_ref` (VARCHAR, nullable)
- `cost` (DECIMAL, nullable)
- `notes` (TEXT, nullable)

**Relationships:**
- `1:N` → service_tickets (service history)
- `1:N` → stock_movements (movement history)

**Acceptance Criteria:**
- [ ] Create physical product record with required fields
- [ ] Serial number uniqueness enforced (database constraint)
- [ ] Warranty end dates are manual input (no auto-calculation)
- [ ] Track current location (virtual warehouse)
- [ ] View complete service history for a serial
- [ ] Cannot delete physical product (soft delete only)

**Business Value:** Complete traceability per unit, warranty management

---

### FR-WH-004: Serial Number Verification & Security

**Requirement:**
Chỉ sản phẩm có serial trong hệ thống mới được bảo hành

**Business Rules:**

1. **Serial Verification Logic:**
   ```
   IF serial_number EXISTS in physical_products table
   AND company_warranty_end_date >= current_date
   → ELIGIBLE for company warranty

   ELSE IF serial_number EXISTS
   AND manufacturer_warranty_end_date >= current_date
   → ELIGIBLE for manufacturer warranty (RMA)

   ELSE
   → NOT ELIGIBLE for warranty (paid repair only)
   ```

2. **Unknown Serial Handling:**
   - Serial KHÔNG có trong database → Không phải hàng chính hãng
   - IF customer DECLINES paid repair → Không làm gì, không tạo record
   - IF customer ACCEPTS paid repair → Tạo physical product record:
     * Set warranty dates = NULL hoặc past date
     * Flag: `out_of_warranty` = true
     * Link với ticket (service_decision = 'paid_repair')

3. **Ownership Transfer:**
   - KHÔNG quan tâm ai là owner hiện tại
   - Chỉ check: Serial có trong system không?
   - Bảo hành transfer được cho bất kỳ người mang đến

**Acceptance Criteria:**
- [ ] Serial lookup function: Check warranty eligibility
- [ ] Display warranty status: Company/Manufacturer/Expired
- [ ] Allow service for unknown serials (with paid repair flag)
- [ ] Cannot delete serial records (maintain history)
- [ ] Audit trail: Serial lookups logged

**Business Value:** Protect against warranty fraud, flexible paid repairs

---

### FR-WH-005: Stock Movement Tracking

**Requirement:**
Track tất cả stock movements trong service operations

**Movement Types (IN SCOPE):**

1. **Reception Intake (IN)**
   - Customer product → Kho Tạm / Đang Dịch Vụ
   - Trigger: Staff nhập kho sản phẩm từ khách
   - Record: Serial, timestamp, staff, photos

2. **Replacement OUT**
   - Kho Bảo Hành → Customer (via ticket)
   - Trigger: Technician xuất sản phẩm replacement
   - Record: Serial, ticket link, timestamp

3. **Faulty Product IN (to RMA)**
   - Đang Dịch Vụ → Kho RMA
   - Trigger: Sản phẩm hư chuyển sang staging cho RMA
   - Record: Serial, ticket link, reason

4. **RMA Outbound**
   - Kho RMA → Shipped to manufacturer
   - Trigger: Batch shipment out
   - Record: Multiple serials, shipment notes

5. **RMA Inbound**
   - Nhận từ manufacturer → Kho Bảo Hành
   - Trigger: Replacement stock arrives
   - Record: Serials, condition (new/refurbished)

6. **Parts Usage (OUT)**
   - Kho Linh Kiện → Used in repair
   - Trigger: Technician adds part to ticket
   - Record: Part SKU, quantity, ticket link

7. **Internal Transfer**
   - Between virtual warehouses
   - Example: Kho Tạm → Kho Hàng Hư Hỏng

**Data Model: stock_movements**
```sql
stock_movements
├─ id (UUID)
├─ movement_type (ENUM: in, out, transfer)
├─ movement_category (ENUM: reception, replacement, rma, parts_usage, transfer)
├─ physical_product_id (FK, nullable) - For products with serial
├─ part_id (FK, nullable) - For parts without serial
├─ quantity (INTEGER, default 1) - For parts only
├─ from_location_id (FK → virtual_warehouses, nullable)
├─ to_location_id (FK → virtual_warehouses, nullable)
├─ ticket_id (FK → service_tickets, nullable)
├─ performed_by (FK → profiles)
├─ timestamp (TIMESTAMP)
├─ notes (TEXT)
└─ metadata (JSONB)
```

**Acceptance Criteria:**
- [ ] Auto-create stock movement on warehouse operations
- [ ] Record both source and destination locations
- [ ] Link movements to tickets (for traceability)
- [ ] Support both serialized products and parts (quantity-based)
- [ ] Movement history viewable per product
- [ ] Cannot delete movements (immutable audit trail)

**Business Value:** Complete traceability, audit compliance

---

### FR-WH-006: Low Stock Alerts

**Requirement:**
System phải alert khi stock của products thấp hơn threshold

**Scope:**
- ✅ Apply to: Products in Kho Bảo Hành (replacement stock)
- ❌ NOT apply to: Parts (unlimited assumption)

**Configuration:**
- Per product type: Set minimum stock level
- Example: RTX 4080 minimum = 3 units
- Admin/Manager configures thresholds

**Alert Logic:**
```
IF stock_in_warranty_warehouse <= threshold
→ Display alert in dashboard
→ Color code: Red (< threshold), Yellow (= threshold), Green (> threshold)
→ Optional: Email notification to manager
```

**Acceptance Criteria:**
- [ ] Admin can set stock threshold per product type
- [ ] Dashboard displays stock levels với color coding
- [ ] Alert badge hiển thị low stock count
- [ ] Optional email alerts (configurable)
- [ ] No blocking of operations (alerts only)

**Business Value:** Proactive inventory management, prevent stockouts

---

### FR-WH-007: Replacement Workflow - Stock Availability

**Requirement:**
Manager có thể approve replacement ngay cả khi out of stock

**Business Rule:**
- Approval KHÔNG bị block bởi stock availability
- Nếu stock = 0:
  * Warehouse OUT task created nhưng status = BLOCKED
  * Task hiển thị: "Chờ hàng về - Stock hiện tại: 0"
  * Khi hàng về (nhập kho mới) → Task auto-unblock
  * Notification to technician
- Customer communication: "Chờ hàng về 3-5 ngày"

**Rationale:**
- Không từ chối khách vì hết hàng tạm thời
- Maintain good customer relationship
- Flexible workflow > Rigid rules

**Acceptance Criteria:**
- [ ] Manager can approve replacement regardless of stock
- [ ] Warehouse OUT task created with BLOCKED status if stock = 0
- [ ] Task displays current stock level
- [ ] Task auto-unblocks when stock becomes available
- [ ] Notification sent to assigned technician

**Business Value:** Customer-first approach, flexibility

---

### FR-WH-008: Parts Management (Simplified)

**Requirement:**
Track parts consumption per ticket, không cần stock validation

**Key Differences from Products:**
- ❌ NO serial numbers (SKU-based only)
- ❌ NO stock alerts
- ❌ NO stock validation (allow negative)
- ✅ Track: Part usage per ticket
- ✅ Track: Quantity consumed

**Workflow:**
1. Technician làm repair task
2. Add part to ticket: Select SKU + Enter quantity
3. System auto:
   - Link part to ticket (service_ticket_parts)
   - Decrease stock quantity (no validation)
   - Create stock movement record
   - Update ticket parts_total

**Data Model: parts (existing table)**
```sql
parts
├─ sku, part_number, name
├─ current_stock (INTEGER) - Can go negative
├─ unit_price (DECIMAL)
└─ ... (existing fields)
```

**Acceptance Criteria:**
- [ ] Technician can add parts to tickets without stock checks
- [ ] Stock decreases automatically (allow negative)
- [ ] Parts consumption tracked per ticket
- [ ] No alerts or validations
- [ ] Focus: Consumption tracking for accounting

**Business Value:** Simple, fast workflow; track costs

---

### FR-WH-009: Barcode Scanning Workflow

**Requirement:**
Support barcode scanning cho serial numbers throughout workflows

**Scanning Points:**

1. **Reception Intake**
   - Scan serial → Auto-fill product info
   - Validate serial exists in database
   - Instant warranty status display

2. **Warehouse OUT (Replacement)**
   - Scan serial of replacement product
   - Validate: Product in correct warehouse
   - Link to ticket automatically

3. **RMA Inbound**
   - Scan multiple serials (batch)
   - Auto-import to Kho Bảo Hành

**Implementation:**
- Barcode scanner = Keyboard input (standard USB scanners)
- Input field: Auto-submit on scanner input (detect Enter key)
- Validation: Immediate feedback (exists/not exists)

**Acceptance Criteria:**
- [ ] Input fields support barcode scanner input
- [ ] Auto-submit on Enter key (from scanner)
- [ ] Immediate validation feedback
- [ ] Display product details on successful scan
- [ ] Error message if serial not found
- [ ] Support manual input as fallback

**Business Value:** Speed, accuracy, reduce typing errors

---

### FR-WH-010: RMA Batch Operations

**Requirement:**
Support batch operations cho RMA shipments

**RMA Outbound (to Manufacturer):**

UI: Kho RMA Management Page
- Display: List sản phẩm trong Kho RMA
- Select: Checkbox multiple products
- Action: Button "Xuất RMA"
- Effect:
  * Update selected products: location = NULL or "shipped_to_manufacturer"
  * Create stock movements (OUT) for each
  * Optional: Notes field (batch info, date)

**RMA Inbound (from Manufacturer):**

UI: Nhập Kho Page
- Input: Scan barcodes (multiple) hoặc manual list
- Destination: "Kho Bảo Hành"
- Condition: Select (new / refurbished)
- Action: Button "Nhập kho"
- Effect:
  * Update products: location → Kho Bảo Hành
  * Update condition
  * Create stock movements (IN)
  * Products ready for replacements

**Out of Scope (Phase 1):**
- ❌ RMA shipment tracking với manufacturer
- ❌ Carrier tracking numbers
- ❌ RMA claim numbers
- ❌ Expected return dates
→ Managed externally (email, Excel)

**Acceptance Criteria:**
- [ ] Multi-select products in Kho RMA
- [ ] Batch export operation
- [ ] Batch import operation (scan multiple serials)
- [ ] Set condition for inbound products
- [ ] All movements logged individually
- [ ] Simple UI, no complex tracking

**Business Value:** Efficient batch operations, focus on inventory

---

## Data Model

### Tables

#### 1. physical_warehouses

```sql
CREATE TABLE physical_warehouses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(100) NOT NULL,
  address TEXT NOT NULL,
  active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT now(),
  updated_at TIMESTAMP DEFAULT now()
);
```

#### 2. virtual_warehouses

```sql
CREATE TABLE virtual_warehouses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  physical_warehouse_id UUID NOT NULL REFERENCES physical_warehouses(id),
  name VARCHAR(100) NOT NULL,
  purpose TEXT,
  warehouse_type VARCHAR(50), -- 'warranty', 'rma', 'faulty', 'parts', 'in_service'
  active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT now(),
  updated_at TIMESTAMP DEFAULT now(),

  CONSTRAINT fk_physical_warehouse
    FOREIGN KEY (physical_warehouse_id)
    REFERENCES physical_warehouses(id)
);
```

#### 3. physical_products

```sql
CREATE TABLE physical_products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  serial_number VARCHAR(100) NOT NULL UNIQUE,
  product_id UUID NOT NULL REFERENCES products(id),
  brand VARCHAR(50) NOT NULL,

  -- Dates
  import_date DATE NOT NULL,
  sale_date DATE,
  manufacturer_warranty_end_date DATE,
  company_warranty_end_date DATE,

  -- Location & Status
  current_location_id UUID REFERENCES virtual_warehouses(id),
  condition VARCHAR(50) DEFAULT 'new',
    -- 'new', 'refurbished', 'faulty', 'in_service', 'out_for_rma', 'shipped_to_manufacturer'

  -- Ownership
  customer_id UUID REFERENCES customers(id),

  -- Optional
  supplier_info TEXT,
  purchase_order_ref VARCHAR(100),
  cost DECIMAL(15,2),
  notes TEXT,

  -- Audit
  created_at TIMESTAMP DEFAULT now(),
  updated_at TIMESTAMP DEFAULT now(),
  created_by UUID REFERENCES profiles(id),

  -- Indexes
  INDEX idx_serial (serial_number),
  INDEX idx_location (current_location_id),
  INDEX idx_customer (customer_id),
  INDEX idx_warranty_dates (company_warranty_end_date, manufacturer_warranty_end_date)
);
```

#### 4. stock_movements

```sql
CREATE TABLE stock_movements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  movement_type VARCHAR(20) NOT NULL, -- 'in', 'out', 'transfer'
  movement_category VARCHAR(50), -- 'reception', 'replacement', 'rma', 'parts_usage', 'transfer'

  -- Product or Part
  physical_product_id UUID REFERENCES physical_products(id),
  part_id UUID REFERENCES parts(id),
  quantity INTEGER DEFAULT 1,

  -- Locations
  from_location_id UUID REFERENCES virtual_warehouses(id),
  to_location_id UUID REFERENCES virtual_warehouses(id),

  -- Context
  ticket_id UUID REFERENCES service_tickets(id),
  performed_by UUID NOT NULL REFERENCES profiles(id),

  timestamp TIMESTAMP DEFAULT now(),
  notes TEXT,
  metadata JSONB,

  -- Constraints
  CONSTRAINT check_product_or_part CHECK (
    (physical_product_id IS NOT NULL AND part_id IS NULL) OR
    (physical_product_id IS NULL AND part_id IS NOT NULL)
  ),

  -- Indexes
  INDEX idx_product (physical_product_id),
  INDEX idx_part (part_id),
  INDEX idx_ticket (ticket_id),
  INDEX idx_timestamp (timestamp DESC)
);
```

#### 5. product_stock_thresholds

```sql
CREATE TABLE product_stock_thresholds (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID NOT NULL REFERENCES products(id),
  virtual_warehouse_id UUID NOT NULL REFERENCES virtual_warehouses(id),
  minimum_quantity INTEGER NOT NULL DEFAULT 3,

  created_at TIMESTAMP DEFAULT now(),
  updated_at TIMESTAMP DEFAULT now(),

  UNIQUE(product_id, virtual_warehouse_id)
);
```

### Views

#### v_warehouse_stock_levels

```sql
CREATE VIEW v_warehouse_stock_levels AS
SELECT
  vw.id AS warehouse_id,
  vw.name AS warehouse_name,
  p.id AS product_id,
  p.name AS product_name,
  COUNT(pp.id) AS current_stock,
  pst.minimum_quantity AS threshold,
  CASE
    WHEN COUNT(pp.id) < pst.minimum_quantity THEN 'low'
    WHEN COUNT(pp.id) = pst.minimum_quantity THEN 'warning'
    ELSE 'ok'
  END AS stock_status
FROM virtual_warehouses vw
CROSS JOIN products p
LEFT JOIN physical_products pp
  ON pp.current_location_id = vw.id
  AND pp.product_id = p.id
LEFT JOIN product_stock_thresholds pst
  ON pst.product_id = p.id
  AND pst.virtual_warehouse_id = vw.id
GROUP BY vw.id, vw.name, p.id, p.name, pst.minimum_quantity;
```

---

## Business Rules

### BR-WH-001: Virtual Warehouse Hierarchy

**Rule:** Mỗi virtual warehouse BẮT BUỘC thuộc 1 physical warehouse

**Enforcement:**
- Database: Foreign key constraint (NOT NULL)
- UI: Required field khi tạo virtual warehouse

**Rationale:** Luôn biết physical location

---

### BR-WH-002: Stock Location Integrity

**Rule:** Physical products CHỈ có thể ở trong virtual warehouses

**Enforcement:**
- `current_location_id` references `virtual_warehouses` table
- Không direct reference to physical warehouses

**Rationale:** Enforce workflow-based organization

---

### BR-WH-003: Warranty Eligibility

**Rule:** Serial verification determines warranty eligibility

**Logic:**
```
company_warranty_end_date >= CURRENT_DATE
  → Company warranty (SSTC handles)

ELSE IF manufacturer_warranty_end_date >= CURRENT_DATE
  → Manufacturer warranty (RMA to manufacturer)

ELSE
  → Out of warranty (paid repair only)
```

**Enforcement:**
- Application logic in warranty check function
- Display in UI with color coding

---

### BR-WH-004: Stock Movement Immutability

**Rule:** Stock movements KHÔNG thể xóa hoặc sửa

**Enforcement:**
- No DELETE permission on stock_movements table
- No UPDATE permission (except via admin override)
- UI: No delete/edit buttons

**Rationale:** Audit trail integrity

---

### BR-WH-005: Replacement Approval Not Blocked

**Rule:** Manager có thể approve replacement ngay cả khi stock = 0

**Enforcement:**
- No validation check in approval workflow
- Task blocked status handled separately

**Rationale:** Customer-first, flexible operations

---

### BR-WH-006: Parts Stock No Validation

**Rule:** Parts có thể go negative, no stock checks

**Enforcement:**
- Remove CHECK constraint on parts.current_stock
- No validation in application

**Rationale:** Simplified workflow, focus on tracking consumption

---

## Workflows

### Workflow 1: Replacement Product Flow

```
┌─────────────────────────────────────────────┐
│ CUSTOMER BRINGS FAULTY PRODUCT              │
└──────────────────┬──────────────────────────┘
                   ↓
┌─────────────────────────────────────────────┐
│ RECEPTION INTAKE                            │
│ - Scan serial (faulty product)              │
│ - Photos                                    │
│ - Nhập kho: "Đang Dịch Vụ"                 │
│                                             │
│ System:                                     │
│ - Create/update physical_product record     │
│ - Create stock_movement (IN)                │
│ - Link to ticket                            │
└──────────────────┬──────────────────────────┘
                   ↓
┌─────────────────────────────────────────────┐
│ DIAGNOSIS                                   │
│ - Technician: Non-repairable               │
│ - Update ticket: is_repairable = false      │
└──────────────────┬──────────────────────────┘
                   ↓
┌─────────────────────────────────────────────┐
│ MANAGER APPROVAL                            │
│ - Approve: service_decision = 'warranty_replace'│
│ - System checks stock (display only)        │
│ - IF stock > 0: OK                          │
│ - IF stock = 0: Approve anyway (wait)       │
└──────────────────┬──────────────────────────┘
                   ↓
┌─────────────────────────────────────────────┐
│ WAREHOUSE OUT TASK                          │
│ - IF stock > 0:                             │
│   * Technician picks replacement            │
│   * Scan serial (new product)               │
│   * System:                                 │
│     - Link to ticket                        │
│     - Create stock_movement (OUT)           │
│     - Update physical_product location      │
│                                             │
│ - IF stock = 0:                             │
│   * Task status: BLOCKED                    │
│   * Display: "Chờ hàng về"                  │
│   * When stock arrives → Auto-unblock       │
└──────────────────┬──────────────────────────┘
                   ↓
┌─────────────────────────────────────────────┐
│ WAREHOUSE IN (FAULTY)                       │
│ - Move faulty product:                      │
│   "Đang Dịch Vụ" → "Kho RMA"               │
│ - System:                                   │
│   - Update physical_product location        │
│   - Create stock_movement (TRANSFER)        │
└──────────────────┬──────────────────────────┘
                   ↓
┌─────────────────────────────────────────────┐
│ TESTING & DELIVERY                          │
│ - Test replacement product                  │
│ - Complete ticket                           │
│ - Return to customer                        │
└─────────────────────────────────────────────┘
```

### Workflow 2: RMA Lifecycle

```
┌─────────────────────────────────────────────┐
│ FAULTY PRODUCTS IN "KHO RMA"                │
│ (From multiple tickets)                     │
└──────────────────┬──────────────────────────┘
                   ↓
┌─────────────────────────────────────────────┐
│ BATCH RMA EXPORT                            │
│ UI: Kho RMA page                            │
│ - Staff selects products (checkbox)         │
│ - Click "Xuất RMA"                          │
│ - Optional: Batch notes                     │
│                                             │
│ System:                                     │
│ - Update physical_products:                 │
│   location = NULL or "shipped_to_mfr"       │
│ - Create stock_movements (OUT) for each    │
└──────────────────┬──────────────────────────┘
                   ↓
┌─────────────────────────────────────────────┐
│ EXTERNAL: Ship to Manufacturer              │
│ (Managed outside system)                    │
└──────────────────┬──────────────────────────┘
                   ↓
┌─────────────────────────────────────────────┐
│ MANUFACTURER REPAIRS/REPLACES               │
│ (Weeks later)                               │
└──────────────────┬──────────────────────────┘
                   ↓
┌─────────────────────────────────────────────┐
│ BATCH RMA IMPORT                            │
│ UI: Nhập Kho page                           │
│ - Staff scans serials (multiple)            │
│ - Select: Destination = "Kho Bảo Hành"     │
│ - Select: Condition = new/refurbished       │
│ - Click "Nhập kho"                          │
│                                             │
│ System:                                     │
│ - Update physical_products:                 │
│   location = Kho Bảo Hành                   │
│   condition = selected                      │
│ - Create stock_movements (IN) for each     │
│ - Products now available for replacements   │
└─────────────────────────────────────────────┘
```

---

## UI/UX Requirements

### UI-WH-001: Warehouse Management Dashboard

**Location:** Admin/Manager menu → Warehouses

**Components:**

1. **Physical Warehouses Section**
   - List: Name, Address, Active status
   - Actions: Add, Edit, Deactivate

2. **Virtual Warehouses Section**
   - Hierarchy view: Physical → Virtual
   - Expand/collapse
   - Per warehouse: Stock counts by product type
   - Color coding: Low stock warnings

3. **Stock Level Summary**
   - Table: Product | Warehouse | Current Stock | Threshold | Status
   - Color codes: 🔴 Low | 🟡 Warning | 🟢 OK
   - Click product → View details

4. **Quick Actions**
   - Button: "Nhập Kho" (multi-product)
   - Button: "Xuất RMA Batch"
   - Button: "Inventory Report"

---

### UI-WH-002: Product Reception Workflow

**Context:** Staff nhận sản phẩm từ khách

**UI Flow:**

```
┌─────────────────────────────────────────────┐
│ TIẾP NHẬN SẢN PHẨM                          │
│                                             │
│ Serial Number:                              │
│ [___________________] [Scan Barcode]        │
│                                             │
│ → After scan/enter:                         │
│ ✅ ZOTAC RTX 4080 Trinity OC                │
│ ✅ Có trong hệ thống                        │
│ ✅ Bảo hành công ty: Đến 15/03/2026         │
│                                             │
│ Chụp hình sản phẩm: * Required              │
│ [📷 Upload] (exterior, seal, serial)        │
│ 📷 front.jpg 📷 seal.jpg 📷 serial.jpg      │
│                                             │
│ Tình trạng bên ngoài:                       │
│ ☑ Seal nguyên vẹn                          │
│ ☐ Seal bị rách/mở                          │
│ ☑ Không trầy xước                          │
│ ☐ Có trầy xước (ghi chú)                   │
│                                             │
│ Nhập vào kho:                               │
│ [Dropdown: Chọn kho ảo] * Required          │
│ - Đang Dịch Vụ                             │
│ - Kho Tạm                                   │
│                                             │
│ Ghi chú:                                    │
│ [Text area...]                              │
│                                             │
│ [Xác Nhận Tiếp Nhận]                       │
└─────────────────────────────────────────────┘
```

**Validation:**
- Serial required
- Photos required
- Destination warehouse required

**After Submit:**
- Create/update physical_product
- Create stock_movement (IN)
- Link to ticket
- Create ticket if auto-create enabled

---

### UI-WH-003: Replacement Product Selection

**Context:** Technician xuất sản phẩm thay thế

**UI Flow:**

```
┌─────────────────────────────────────────────┐
│ XUẤT SẢN PHẨM THAY THẾ                      │
│ Ticket: SV-2025-150 (RTX 4080)             │
│                                             │
│ Cần thay thế: ZOTAC RTX 4080               │
│                                             │
│ Tồn kho hiện tại: 3 cái                    │
│ Kho: Kho Bảo Hành                          │
│                                             │
│ Quét serial sản phẩm thay thế:              │
│ [___________________] [Scan]                │
│                                             │
│ → After scan:                               │
│ ✅ Serial: ZT-XXX-NEW-001                   │
│ ✅ Tình trạng: Mới (new)                    │
│ ✅ Có trong Kho Bảo Hành                   │
│                                             │
│ [Xác Nhận Xuất Kho]                        │
└─────────────────────────────────────────────┘
```

**If Stock = 0:**

```
┌─────────────────────────────────────────────┐
│ XUẤT SẢN PHẨM THAY THẾ                      │
│ Ticket: SV-2025-150                         │
│                                             │
│ ⚠️ HẾT HÀNG                                 │
│ Tồn kho hiện tại: 0 cái                    │
│                                             │
│ Task này sẽ tự động mở khóa khi có hàng về.│
│                                             │
│ Thông báo khách: "Chờ hàng về 3-5 ngày"   │
│                                             │
│ [OK]                                        │
└─────────────────────────────────────────────┘
```

---

### UI-WH-004: RMA Batch Operations

**RMA Export Page:**

```
┌─────────────────────────────────────────────┐
│ KHO RMA - XUẤT HÀNG VỀ NHÀ MÁY              │
│                                             │
│ Sản phẩm trong kho: 12 items               │
│                                             │
│ ☐ Select All                                │
│ ─────────────────────────────────────────── │
│ ☑ RTX 4080 - Serial: ZT-001 - Ticket: SV-150│
│ ☑ SSD 1TB - Serial: SS-002 - Ticket: SV-151│
│ ☐ RTX 4070 - Serial: ZT-003 - Ticket: SV-152│
│ ...                                         │
│                                             │
│ Selected: 2 items                           │
│                                             │
│ Ghi chú batch (optional):                   │
│ [RMA Batch #2025-01, Ship date: 22/01]     │
│                                             │
│ [Xuất RMA] [Cancel]                         │
└─────────────────────────────────────────────┘
```

**RMA Import Page:**

```
┌─────────────────────────────────────────────┐
│ NHẬP HÀNG TỪ NHÀ MÁY                        │
│                                             │
│ Quét serials (nhiều cái):                   │
│ [___________________] [Scan]                │
│                                             │
│ Đã quét:                                    │
│ ✅ ZT-RTX-NEW-001                           │
│ ✅ ZT-RTX-NEW-002                           │
│ ✅ SS-SSD-NEW-003                           │
│                                             │
│ Nhập vào kho:                               │
│ ● Kho Bảo Hành (selected)                  │
│ ○ Kho Tạm                                   │
│                                             │
│ Tình trạng sản phẩm:                        │
│ ● Mới (new)                                 │
│ ○ Refurbished                               │
│                                             │
│ [Nhập Kho] (3 items)                        │
└─────────────────────────────────────────────┘
```

---

## Edge Cases

### EC-WH-001: Serial Already in Another Location

**Scenario:** Staff scans serial đã có location khác

**Behavior:**
- Display warning: "Serial này đang ở [Location X]"
- Options:
  - Override (transfer to new location)
  - Cancel (keep in current location)
- If override: Create transfer stock movement

---

### EC-WH-002: Duplicate Serial in Import

**Scenario:** Same serial scanned twice trong RMA import batch

**Behavior:**
- Display error immediately: "Serial đã được quét"
- Remove duplicate from list
- Continue with unique serials only

---

### EC-WH-003: Unknown Serial in Reception

**Scenario:** Customer serial không có trong database

**Behavior:**
- Display: "Serial không có trong hệ thống"
- Options:
  1. Không tiếp nhận (reject)
  2. Tiếp nhận dịch vụ trả phí (create new record)
     - If accept paid: Create physical_product:
       * warranty dates = NULL
       * Flag: out_of_warranty
       * Link to ticket with paid_repair decision

---

### EC-WH-004: Replacement Out of Stock

**Scenario:** Manager approves replacement, stock = 0

**Behavior:**
- Allow approval (no blocking)
- Warehouse OUT task created with BLOCKED status
- Display in task: "Chờ hàng về - Stock: 0"
- When stock arrives (nhập kho event):
  * Check for blocked tasks
  * Auto-update task status → PENDING
  * Notify assigned technician

---

### EC-WH-005: Product in Multiple Tickets

**Scenario:** Same serial linked to multiple open tickets

**Behavior:**
- System should prevent (business rule)
- Validation: Check physical_product.current_ticket_id
- Error: "Sản phẩm này đang được xử lý trong ticket SV-XXX"
- Resolution: Complete previous ticket first

---

### EC-WH-006: Warranty Date in Past

**Scenario:** Staff nhập warranty end date đã qua

**Behavior:**
- No validation error (allow)
- System correctly calculates: Out of warranty
- Useful for historical data entry

---

### EC-WH-007: RMA Import Serial Not in System

**Scenario:** Manufacturer sends back wrong serial or new serial

**Behavior:**
- Display warning: "Serial mới (không có trong hệ thống)"
- Options:
  1. Skip (don't import)
  2. Create new record (if confirmed replacement)
- If create: Set origin = manufacturer_replacement

---

## Assumptions

1. **Barcode Scanners:** USB barcode scanners act as keyboard input
2. **Network:** Staff have stable network for real-time updates
3. **Photos:** Staff use smartphone or camera to capture images
4. **Physical Access:** Warehouse staff có physical access to products
5. **Training:** Staff được training về virtual warehouse concept

---

## Dependencies

- ✅ `products` table (existing - product catalog)
- ✅ `parts` table (existing - parts inventory)
- ✅ `customers` table (existing)
- ✅ `profiles` table (existing - staff users)
- ✅ `service_tickets` table (existing/modified)
- ⚠️ Photo upload infrastructure (S3/storage bucket)
- ⚠️ Barcode scanning hardware (procurement)

---

## Success Metrics

- **Traceability:** 100% of serialized products have complete movement history
- **Speed:** Reception intake < 3 minutes per product
- **Accuracy:** < 1% serial number errors (via barcode scanning)
- **Stock Visibility:** Real-time stock levels in dashboard
- **Alert Response:** Low stock alerts lead to reorder within 24 hours
- **Replacement Speed:** Warehouse OUT task completion < 15 minutes (if in stock)

---

## Open Questions

1. **Photo Storage:** S3 bucket strategy? Retention policy?
2. **Barcode Hardware:** Which scanner models to procure?
3. **Historical Data:** Import existing products? Cutover strategy?
4. **Inter-warehouse Transfer:** Between physical locations - need now or Phase 2?
5. **Inventory Audits:** Physical count reconciliation process?

---

**Document Status:** Draft - Ready for Review
**Next Steps:** Review with stakeholders → Technical design → Implementation planning

---

*Generated by: Mary (Business Analyst)*
*Based on: Requirements elicitation session 2025-01-22*
