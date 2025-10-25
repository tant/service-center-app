# Warehouse Management System - Feature Documentation

**Service Center Phase 2**
**Version:** 1.0
**Last Updated:** 2025-10-24
**Related Stories:** 1.6, 1.7, 1.8, 1.9, 1.10

---

## Table of Contents

1. [Overview](#overview)
2. [Warehouse Types](#warehouse-types)
3. [Product Tracking](#product-tracking)
4. [Stock Operations](#stock-operations)
5. [Automation](#automation)
6. [Technical Details](#technical-details)
7. [Best Practices](#best-practices)

---

## Overview

The Warehouse Management System provides comprehensive inventory tracking for serialized products with warranty management. It supports both physical warehouse locations and virtual warehouse categories, enabling precise tracking of products through their lifecycle from receipt to service completion.

### Key Capabilities

- **Dual Warehouse System**: Physical locations and virtual categorization
- **Serial Number Tracking**: Unique identification for each product instance
- **Warranty Management**: Automatic warranty calculation and expiration tracking
- **Movement Audit Trail**: Complete history of all product movements
- **Automated Stock Movements**: Products automatically move based on ticket status
- **Low Stock Alerts**: Configurable thresholds with real-time monitoring
- **RMA Batch Operations**: Batch processing for supplier returns

### System Architecture

```
Physical Products (Serialized)
    ├── Virtual Warehouse (Category)
    │   ├── Warranty Stock
    │   ├── RMA Staging
    │   ├── Dead Stock
    │   ├── In Service
    │   └── Parts
    └── Physical Warehouse (Location)
        └── User-defined locations
```

---

## Warehouse Types

### Virtual Warehouses

Virtual warehouses are system-defined categories that classify products by their current status or purpose. These are auto-created and cannot be modified by users.

#### 1. Warranty Stock (`warranty_stock`)

**Purpose:** Products under active warranty available for customer replacements

**Characteristics:**
- New or refurbished condition
- Active warranty coverage
- Available for immediate assignment to tickets
- Default destination when products return from service

**Typical Products:**
- Brand new replacement units
- Refurbished warranty stock
- Products with manufacturer warranty

**Color Code:** Green (#10B981)

#### 2. RMA Staging (`rma_staging`)

**Purpose:** Products awaiting return to supplier or manufacturer

**Characteristics:**
- Faulty products under supplier warranty
- Organized into RMA batches
- Tracked with batch numbers (RMA-YYYY-MM-NNN)
- Includes shipping tracking information

**Typical Products:**
- Defective units within supplier warranty
- Products failing quality checks
- Items requiring manufacturer inspection

**Color Code:** Orange (#F59E0B)

#### 3. Dead Stock (`dead_stock`)

**Purpose:** Non-functional products for parts harvesting or disposal

**Characteristics:**
- Beyond economic repair
- No warranty coverage
- Can be cannibalized for parts
- Marked for disposal

**Typical Products:**
- Severely damaged units
- End-of-life products
- Unrepairable warranty claims

**Color Code:** Red (#EF4444)

#### 4. In Service (`in_service`)

**Purpose:** Products currently assigned to active service tickets

**Characteristics:**
- Temporarily assigned to tickets
- Automatically moved when ticket status changes
- Cannot be manually assigned to other tickets
- Returns to previous warehouse on ticket completion

**Typical Products:**
- Replacement units given to customers
- Products under active repair
- Loaner devices during service

**Color Code:** Blue (#3B82F6)

#### 5. Parts (`parts`)

**Purpose:** Individual components and replacement parts inventory

**Characteristics:**
- Component-level tracking
- Used in repairs
- Separate from whole product inventory
- Can be harvested from dead stock

**Typical Products:**
- Replacement screens
- Batteries
- Circuit boards
- Cables and accessories

**Color Code:** Purple (#8B5CF6)

### Physical Warehouses

Physical warehouses represent actual storage locations within your facilities. These are user-defined and can be created/modified by Admin and Manager roles.

**Attributes:**
- **Name**: Descriptive name (e.g., "Main Warehouse", "Repair Station 2")
- **Code**: Short unique identifier (auto-generated: WH-001, WH-002)
- **Location**: Detailed address or position (e.g., "Building A, Floor 2, Room 203")
- **Description**: Optional details about the warehouse
- **Status**: Active/Inactive

**Examples:**
- Main storage facility
- Service center repair stations
- Receiving area
- Quality control section
- Parts storage shelves

**Validation:**
- Cannot delete warehouses containing products
- Soft delete (set `is_active = false`) for warehouses with history
- Must have unique code

---

## Product Tracking

### Physical Products Master Data

Each serialized product in the system is tracked as a unique entity with comprehensive details.

#### Core Attributes

**Identity:**
- **Serial Number**: Unique alphanumeric identifier (uppercase, A-Z, 0-9, dash, underscore)
- **Product Reference**: Links to product master (product catalog)
- **Condition**: Physical state (new, refurbished, used, faulty, for_parts)

**Location:**
- **Virtual Warehouse Type**: Current category (warranty_stock, rma_staging, etc.)
- **Physical Warehouse ID**: Actual storage location (optional)
- **Current Ticket ID**: Service ticket if assigned (null when not in service)

**Warranty Information:**
- **Warranty Start Date**: When warranty period begins
- **Warranty Months**: Duration in months
- **Warranty End Date**: Auto-calculated from start date + months
- **Warranty Status**: Calculated based on current date
  - `active`: More than 30 days remaining
  - `expiring_soon`: 1-30 days remaining
  - `expired`: Past end date
  - `unknown`: No warranty dates set

**Supplier/Purchase:**
- **Supplier ID**: Reference to supplier (optional)
- **Supplier Name**: Supplier identifier
- **Purchase Date**: When product was acquired
- **Purchase Price**: Cost for inventory valuation

**RMA Tracking:**
- **RMA Batch ID**: If part of an RMA batch
- **RMA Reason**: Reason for return
- **RMA Date**: When returned to supplier

**Additional:**
- **Notes**: Free-text notes about the product
- **Photo URLs**: Array of product photos
- **Created At**: When added to inventory
- **Updated At**: Last modification timestamp

#### Serial Number Validation

**Format Rules:**
- Minimum length: 5 characters
- Maximum length: 255 characters
- Pattern: `/^[A-Z0-9-_]+$/` (alphanumeric, dash, underscore)
- Case handling: Automatically converted to uppercase

**Examples:**
- `IPHONE13-12345678`
- `MAC_BOOK_PRO_2023_ABC123`
- `SCREEN-LG-55-XYZ-456`

**Uniqueness:**
- Serial numbers must be globally unique
- Validation performed at database constraint level
- Bulk import validates against existing serials

#### Product Conditions

| Condition | Description | Typical Use |
|-----------|-------------|-------------|
| **new** | Brand new, unused | Warranty replacements, new stock |
| **refurbished** | Professionally refurbished | Warranty stock, customer replacements |
| **used** | Previously used, functional | Trade-ins, secondary market |
| **faulty** | Not working properly | Needs repair, RMA candidates |
| **for_parts** | Not functional | Parts harvesting, scrap |

### Product Registration

**Methods:**

1. **Single Product Entry** (UI Form)
   - Manual entry via Product Registration Modal
   - Real-time serial number validation
   - Optional photo upload (max 5 photos per product)
   - Immediate inventory availability

2. **Bulk Import** (CSV/Excel)
   - Upload up to 1,000 products per batch
   - Required columns: serial_number, product_sku, condition, warehouse_type
   - Optional columns: warranty_start_date, warranty_months, purchase_price
   - Duplicate detection (both within batch and against database)
   - Error reporting with row numbers
   - Partial success handling (successful imports processed, errors reported)

3. **API Integration** (tRPC)
   - Direct API calls for external system integration
   - Supports programmatic inventory management
   - Same validation rules as manual entry

**Registration Workflow:**

```
1. Input Product Data
   ↓
2. Validate Serial Number (uniqueness, format)
   ↓
3. Validate Product SKU (exists in catalog)
   ↓
4. Validate Warehouse Type (valid ENUM)
   ↓
5. Calculate Warranty End Date (if warranty info provided)
   ↓
6. Create Physical Product Record
   ↓
7. Record Initial Stock Movement (receipt)
   ↓
8. Product Available in Inventory
```

---

## Stock Operations

### Stock Movements

All product movements between warehouses are recorded in an immutable audit trail. Each movement captures complete context and cannot be modified after creation.

#### Movement Types

| Type | Code | Description | Direction |
|------|------|-------------|-----------|
| **Receipt** | `receipt` | Product received from supplier | External → Warehouse |
| **Transfer** | `transfer` | Move between physical locations | Warehouse → Warehouse |
| **Assignment** | `assignment` | Assign to service ticket | Warehouse → In Service |
| **Return** | `return` | Return from service ticket | In Service → Warehouse |
| **Disposal** | `disposal` | Product disposed or scrapped | Warehouse → External |

#### Movement Recording

**Manual Movement:**
- Initiated via Record Movement Modal
- User selects movement type
- Specify from/to locations
- Optional: ticket reference, reason, notes
- System validates: product not in service (unless force flag)

**Automatic Movement:**
- Triggered by ticket status changes
- See [Automation](#automation) section

**Movement Record Fields:**
- **Physical Product ID**: Product being moved
- **Movement Type**: One of 5 types above
- **From Virtual Warehouse**: Source category (optional)
- **To Virtual Warehouse**: Destination category (optional)
- **From Physical Warehouse**: Source location (optional)
- **To Physical Warehouse**: Destination location (optional)
- **Ticket ID**: Associated service ticket (optional)
- **Reason**: Brief explanation (optional)
- **Notes**: Detailed notes (optional)
- **Moved By ID**: User who performed movement
- **Created At**: Timestamp (immutable)

**Validation Rules:**
- At least one location must change (virtual or physical)
- Product must exist
- Product must not be in active service (unless force flag)
- User must have permission (admin, manager, technician)

### Movement History

Each product has a complete chronological audit trail accessible via:

1. **Product Details Page**: Movement history timeline
2. **Movement History Widget**: Visual timeline with icons
3. **Movement History Table**: Filterable, searchable list
4. **Export**: CSV/Excel export of movement history

**Timeline Display:**
- Date/time of movement
- Movement type with icon
- From → To locations (both virtual and physical)
- User who performed movement
- Ticket reference (if applicable)
- Reason/notes
- Color-coded by movement type

### Serial Number Verification

The system provides real-time serial number verification for reception and ticket creation workflows.

**Verification Widget:**
- Input serial number
- Real-time lookup (debounced)
- Returns:
  - Product details (name, SKU, brand)
  - Warranty status badge
  - Days remaining (if warranty active)
  - Current location (virtual and physical)
  - In-service status
  - Current ticket reference (if assigned)
  - Product photos

**Verification Results:**

```typescript
{
  found: boolean,
  product?: {
    id, serial_number, condition,
    product: { name, sku, brand }
  },
  warranty: {
    status: 'active' | 'expiring_soon' | 'expired' | 'unknown',
    daysRemaining: number | null,
    startDate, endDate
  },
  location: {
    virtual: { warehouse_type, display_name },
    physical: { name, code } | null
  },
  inService: boolean,
  currentTicket?: { id, ticket_number, status }
}
```

**Use Cases:**
- Ticket creation: Verify warranty before accepting repair
- Reception: Check if product already exists in inventory
- Quality control: Validate product authenticity
- Customer inquiries: Quick status lookup

---

## Stock Levels and Alerts

### Stock Level Monitoring

The system provides real-time stock level monitoring via a materialized database view (`v_warehouse_stock_levels`).

**View Aggregation:**
- Groups products by: product_id + virtual_warehouse_type + condition
- Calculates counts, warranty status distribution, inventory value
- Joins with threshold configuration
- Computes alert status (ok/warning/critical)

**Displayed Metrics:**
- Product name, SKU, brand
- Virtual warehouse type
- Product condition
- Current quantity
- Active warranty count
- Expiring soon count (< 30 days)
- Expired count
- Total purchase value
- Average purchase price
- Minimum threshold
- Reorder quantity
- Alert status

### Stock Thresholds

Thresholds are configured per product + virtual warehouse combination.

**Threshold Configuration:**

| Field | Description | Default |
|-------|-------------|---------|
| **Minimum Quantity** | Alert when stock falls below | 5 |
| **Reorder Quantity** | Suggested reorder amount | 10 |
| **Maximum Quantity** | Storage planning limit | 100 |
| **Alert Enabled** | Enable/disable alerts | true |

**Default Thresholds:**
- **Warranty Stock**: minimum=5, reorder=10 (most critical)
- **RMA Staging**: minimum=10, reorder=20
- **Other Warehouses**: No defaults (optional)

**Status Calculation:**

```
IF current_stock > minimum_quantity THEN
  status = 'ok'
ELSE IF current_stock >= (minimum_quantity * 0.5) THEN
  status = 'warning'  -- At or below threshold, but above 50%
ELSE
  status = 'critical'  -- Below 50% of threshold
END IF
```

**Examples:**
- Threshold=10, Stock=12 → `ok` (green)
- Threshold=10, Stock=8 → `warning` (yellow)
- Threshold=10, Stock=4 → `critical` (red)

### Low Stock Alerts

Low stock alerts are prominently displayed on the Stock Levels Dashboard.

**Alert Display:**
- **Critical Alert Banner**: Red banner showing critical items
  - Shows top 3 critical items
  - Indicates total count if more than 3
  - Item format: `[Stock Count] Product Name in Warehouse (Threshold: X)`
- **Warning Alert**: Yellow notice showing warning count
- **Dashboard Stats**: Cards showing total warnings and critical items

**Alert Query:**
- Filters: `stock_status IN ('warning', 'critical')`
- Sort: Critical first, then by lowest stock
- Only shows products with `alert_enabled = true`

**Alert Management:**
- View via Stock Levels Dashboard (`/dashboard/inventory/stock-levels`)
- Click item to view product details
- Adjust threshold via Set Threshold Modal
- Export alerts to CSV

**Refresh Strategy:**
- Manual refresh: Materialized view refreshed before each query
- Function: `refresh_warehouse_stock_levels()`
- Ensures up-to-date data without performance penalty

---

## Automation

### Automatic Product Movement (Story 1.8)

Products automatically move to and from the "In Service" virtual warehouse based on service ticket events.

#### Trigger Function: `auto_move_product_on_ticket_event()`

**Trigger Conditions:**
- Fires on INSERT or UPDATE of `service_tickets` table
- Only processes tickets with `serial_number` field populated
- Runs AFTER the ticket operation completes

#### Movement Logic

**Scenario 1: Ticket Created or In Progress**

```
WHEN ticket.status IN ('pending', 'in_progress')
AND ticket.serial_number IS NOT NULL
THEN
  1. Find product by serial_number
  2. Record current virtual_warehouse_type as "previous"
  3. Create stock_movement:
     - movement_type: 'assignment'
     - from_virtual_warehouse: previous warehouse
     - to_virtual_warehouse: 'in_service'
     - ticket_id: current ticket
     - notes: "Auto-moved to In Service (ticket SV-2025-001)"
     - moved_by_id: ticket.created_by_id
  4. Update physical_product:
     - virtual_warehouse_type: 'in_service'
     - current_ticket_id: ticket.id
```

**Scenario 2: Ticket Completed**

```
WHEN ticket.status = 'completed'
AND ticket.serial_number IS NOT NULL
THEN
  1. Find product by serial_number
  2. Look up original warehouse from last 'assignment' movement
  3. If not found, default to 'warranty_stock'
  4. Create stock_movement:
     - movement_type: 'return'
     - from_virtual_warehouse: 'in_service'
     - to_virtual_warehouse: original warehouse
     - ticket_id: current ticket
     - notes: "Auto-moved from In Service (ticket SV-2025-001 completed)"
     - moved_by_id: ticket.updated_by_id or ticket.created_by_id
  5. Update physical_product:
     - virtual_warehouse_type: original warehouse
     - current_ticket_id: NULL
```

**Edge Cases Handled:**
- Serial number not found → No action, return silently
- Product already in service → Update current ticket reference
- Previous warehouse not found → Default to warranty_stock
- Multiple status updates → Only triggers on status change

**Example Flow:**

```
1. Product Serial ABC123 in warranty_stock
   ↓
2. Ticket SV-2025-001 created with serial ABC123
   → Trigger fires
   → Movement recorded: warranty_stock → in_service
   → Product updated: current_ticket_id = SV-2025-001
   ↓
3. Technician completes repair, updates ticket status to 'completed'
   → Trigger fires
   → Movement recorded: in_service → warranty_stock
   → Product updated: current_ticket_id = NULL
   ↓
4. Product back in warranty_stock, available for next ticket
```

**Benefits:**
- Zero manual intervention required
- Complete audit trail maintained
- Prevents manual movement errors
- Ensures consistent workflow

### Real-time Stock Updates

Stock level view automatically reflects changes when:
- New products registered
- Stock movements recorded
- Products assigned to tickets
- Tickets completed
- Thresholds modified

**Refresh Mechanism:**
- Materialized view: `v_warehouse_stock_levels`
- Refresh function: `refresh_warehouse_stock_levels()`
- Called automatically before each stock level query
- < 500ms refresh time for 1000+ products

---

## Technical Details

### Database Schema

#### Tables

**1. physical_warehouses**
```sql
CREATE TABLE physical_warehouses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  code VARCHAR(20) NOT NULL UNIQUE,
  location TEXT,
  description TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
```

**Indexes:**
- `idx_physical_warehouses_code` on `code`
- `idx_physical_warehouses_active` on `is_active` WHERE `is_active = true`

---

**2. virtual_warehouses**
```sql
CREATE TABLE virtual_warehouses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  warehouse_type warehouse_type NOT NULL UNIQUE,
  display_name VARCHAR(255) NOT NULL,
  description TEXT,
  color_code VARCHAR(7),
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
```

**ENUM:** `warehouse_type`
```sql
CREATE TYPE warehouse_type AS ENUM (
  'warranty_stock',
  'rma_staging',
  'dead_stock',
  'in_service',
  'parts'
);
```

**Indexes:**
- `idx_virtual_warehouses_type` on `warehouse_type`
- `idx_virtual_warehouses_active` on `is_active` WHERE `is_active = true`

---

**3. physical_products**
```sql
CREATE TABLE physical_products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID NOT NULL REFERENCES products(id),
  serial_number VARCHAR(255) NOT NULL UNIQUE,
  condition product_condition NOT NULL DEFAULT 'new',

  -- Warehouse location
  virtual_warehouse_type warehouse_type NOT NULL DEFAULT 'warranty_stock',
  physical_warehouse_id UUID REFERENCES physical_warehouses(id),

  -- Warranty tracking
  warranty_start_date DATE,
  warranty_months INT,
  warranty_end_date DATE, -- Auto-calculated

  -- Service association
  current_ticket_id UUID REFERENCES service_tickets(id),

  -- RMA tracking
  rma_batch_id UUID REFERENCES rma_batches(id),
  rma_reason TEXT,
  rma_date DATE,

  -- Supplier info
  supplier_id UUID,
  supplier_name VARCHAR(255),
  purchase_date DATE,
  purchase_price DECIMAL(10,2),

  notes TEXT,
  photo_urls TEXT[],
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
```

**ENUM:** `product_condition`
```sql
CREATE TYPE product_condition AS ENUM (
  'new', 'refurbished', 'used', 'faulty', 'for_parts'
);
```

**Indexes:**
- `idx_physical_products_product` on `product_id`
- `idx_physical_products_serial` on `serial_number`
- `idx_physical_products_virtual_warehouse` on `virtual_warehouse_type`
- `idx_physical_products_physical_warehouse` on `physical_warehouse_id` WHERE NOT NULL
- `idx_physical_products_condition` on `condition`
- `idx_physical_products_current_ticket` on `current_ticket_id` WHERE NOT NULL
- `idx_physical_products_warranty_expiring` on `warranty_end_date` WHERE NOT NULL

**Triggers:**
- `trigger_physical_products_warranty_calculation`: Auto-calculate warranty_end_date
- `trigger_physical_products_updated_at`: Auto-update updated_at

---

**4. stock_movements**
```sql
CREATE TABLE stock_movements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  physical_product_id UUID NOT NULL REFERENCES physical_products(id),

  movement_type movement_type NOT NULL,

  from_virtual_warehouse warehouse_type,
  to_virtual_warehouse warehouse_type,
  from_physical_warehouse_id UUID REFERENCES physical_warehouses(id),
  to_physical_warehouse_id UUID REFERENCES physical_warehouses(id),

  ticket_id UUID REFERENCES service_tickets(id),

  reason TEXT,
  notes TEXT,
  moved_by_id UUID NOT NULL REFERENCES profiles(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  CONSTRAINT stock_movements_virtual_warehouse_changed CHECK (
    from_virtual_warehouse IS DISTINCT FROM to_virtual_warehouse OR
    from_physical_warehouse_id IS DISTINCT FROM to_physical_warehouse_id
  )
);
```

**ENUM:** `movement_type`
```sql
CREATE TYPE movement_type AS ENUM (
  'receipt', 'transfer', 'assignment', 'return', 'disposal'
);
```

**Indexes:**
- `idx_stock_movements_product` on `physical_product_id`
- `idx_stock_movements_type` on `movement_type`
- `idx_stock_movements_from_virtual` on `from_virtual_warehouse` WHERE NOT NULL
- `idx_stock_movements_to_virtual` on `to_virtual_warehouse` WHERE NOT NULL
- `idx_stock_movements_ticket` on `ticket_id` WHERE NOT NULL
- `idx_stock_movements_created` on `created_at DESC`
- `idx_stock_movements_moved_by` on `moved_by_id`

---

**5. product_stock_thresholds**
```sql
CREATE TABLE product_stock_thresholds (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID NOT NULL REFERENCES products(id),
  warehouse_type warehouse_type NOT NULL,

  minimum_quantity INT NOT NULL,
  reorder_quantity INT,
  maximum_quantity INT,

  alert_enabled BOOLEAN NOT NULL DEFAULT true,
  last_alert_sent_at TIMESTAMPTZ,

  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  CONSTRAINT product_stock_thresholds_product_warehouse_unique
    UNIQUE(product_id, warehouse_type),
  CONSTRAINT product_stock_thresholds_quantities_valid CHECK (
    minimum_quantity >= 0 AND
    (reorder_quantity IS NULL OR reorder_quantity >= minimum_quantity) AND
    (maximum_quantity IS NULL OR maximum_quantity >= minimum_quantity)
  )
);
```

**Indexes:**
- `idx_product_stock_thresholds_product` on `product_id`
- `idx_product_stock_thresholds_warehouse` on `warehouse_type`
- `idx_product_stock_thresholds_alerts_enabled` on `(alert_enabled, warehouse_type)` WHERE `alert_enabled = true`

---

#### Database Views

**1. v_warehouse_stock_levels** (Materialized)

Aggregates current stock levels by product and warehouse type with alert status.

```sql
CREATE MATERIALIZED VIEW v_warehouse_stock_levels AS
SELECT
  p.id AS product_id,
  p.name AS product_name,
  p.sku AS product_sku,
  b.name AS brand_name,
  pp.virtual_warehouse_type AS warehouse_type,
  pp.condition,

  -- Stock counts
  COUNT(*) AS quantity,
  COUNT(*) FILTER (WHERE pp.warranty_end_date > CURRENT_DATE + INTERVAL '30 days')
    AS active_warranty_count,
  COUNT(*) FILTER (WHERE pp.warranty_end_date > CURRENT_DATE
    AND pp.warranty_end_date <= CURRENT_DATE + INTERVAL '30 days')
    AS expiring_soon_count,
  COUNT(*) FILTER (WHERE pp.warranty_end_date <= CURRENT_DATE)
    AS expired_count,

  -- Value calculations
  SUM(pp.purchase_price) AS total_purchase_value,
  AVG(pp.purchase_price) AS avg_purchase_price,

  -- Threshold info
  pst.minimum_quantity,
  pst.reorder_quantity,
  pst.maximum_quantity,
  pst.alert_enabled,

  -- Alert status
  CASE
    WHEN pst.minimum_quantity IS NOT NULL AND COUNT(*) < pst.minimum_quantity
      THEN true
    ELSE false
  END AS is_below_minimum,

  MIN(pp.created_at) AS oldest_stock_date,
  MAX(pp.created_at) AS newest_stock_date

FROM physical_products pp
JOIN products p ON pp.product_id = p.id
JOIN brands b ON p.brand_id = b.id
LEFT JOIN product_stock_thresholds pst
  ON pst.product_id = p.id
  AND pst.warehouse_type = pp.virtual_warehouse_type

GROUP BY p.id, p.name, p.sku, b.name,
  pp.virtual_warehouse_type, pp.condition,
  pst.minimum_quantity, pst.reorder_quantity,
  pst.maximum_quantity, pst.alert_enabled

ORDER BY b.name, p.name, pp.virtual_warehouse_type;
```

**Refresh Function:**
```sql
CREATE OR REPLACE FUNCTION refresh_warehouse_stock_levels()
RETURNS void AS $$
BEGIN
  REFRESH MATERIALIZED VIEW v_warehouse_stock_levels;
END;
$$ LANGUAGE plpgsql;
```

---

**2. v_stock_movement_history**

Detailed view of stock movements with full context.

```sql
CREATE VIEW v_stock_movement_history AS
SELECT
  sm.id AS movement_id,
  sm.movement_type,
  sm.created_at AS moved_at,

  -- Product info
  pp.id AS physical_product_id,
  pp.serial_number,
  pp.condition,
  p.name AS product_name,
  p.sku AS product_sku,
  b.name AS brand_name,

  -- From location
  sm.from_virtual_warehouse,
  fw.name AS from_physical_warehouse_name,
  fw.code AS from_physical_warehouse_code,

  -- To location
  sm.to_virtual_warehouse,
  tw.name AS to_physical_warehouse_name,
  tw.code AS to_physical_warehouse_code,

  -- Ticket association
  sm.ticket_id,
  st.ticket_number,
  st.status AS ticket_status,

  -- Movement details
  sm.reason,
  sm.notes,

  -- User info
  sm.moved_by_id,
  prof.full_name AS moved_by_name,
  prof.role AS moved_by_role

FROM stock_movements sm
JOIN physical_products pp ON sm.physical_product_id = pp.id
JOIN products p ON pp.product_id = p.id
JOIN brands b ON p.brand_id = b.id
LEFT JOIN physical_warehouses fw ON sm.from_physical_warehouse_id = fw.id
LEFT JOIN physical_warehouses tw ON sm.to_physical_warehouse_id = tw.id
LEFT JOIN service_tickets st ON sm.ticket_id = st.id
LEFT JOIN profiles prof ON sm.moved_by_id = prof.id

ORDER BY sm.created_at DESC;
```

---

**3. v_low_stock_alerts**

Products below minimum stock thresholds.

```sql
CREATE VIEW v_low_stock_alerts AS
SELECT
  p.id AS product_id,
  p.name AS product_name,
  p.sku AS product_sku,
  b.name AS brand_name,

  pst.warehouse_type,
  pst.minimum_quantity,
  pst.reorder_quantity,
  pst.maximum_quantity,

  COALESCE(stock.quantity, 0) AS current_quantity,
  pst.minimum_quantity - COALESCE(stock.quantity, 0) AS quantity_below_minimum,

  pst.alert_enabled,
  pst.last_alert_sent_at,

  pst.created_at AS threshold_created_at,
  pst.updated_at AS threshold_updated_at

FROM product_stock_thresholds pst
JOIN products p ON pst.product_id = p.id
JOIN brands b ON p.brand_id = b.id
LEFT JOIN (
  SELECT product_id, virtual_warehouse_type, COUNT(*) AS quantity
  FROM physical_products
  GROUP BY product_id, virtual_warehouse_type
) stock ON stock.product_id = p.id
  AND stock.virtual_warehouse_type = pst.warehouse_type

WHERE pst.alert_enabled = true
  AND COALESCE(stock.quantity, 0) < pst.minimum_quantity

ORDER BY (pst.minimum_quantity - COALESCE(stock.quantity, 0)) DESC,
  b.name, p.name;
```

---

**4. v_warranty_expiring_soon**

Products with warranty expiring within 30 days.

```sql
CREATE VIEW v_warranty_expiring_soon AS
SELECT
  pp.id AS physical_product_id,
  pp.serial_number,
  pp.condition,
  pp.virtual_warehouse_type,

  p.id AS product_id,
  p.name AS product_name,
  p.sku AS product_sku,
  b.name AS brand_name,

  pp.warranty_start_date,
  pp.warranty_months,
  pp.warranty_end_date,
  CASE
    WHEN pp.warranty_end_date IS NULL THEN 'unknown'
    WHEN pp.warranty_end_date <= CURRENT_DATE THEN 'expired'
    WHEN pp.warranty_end_date <= CURRENT_DATE + INTERVAL '30 days' THEN 'expiring_soon'
    ELSE 'active'
  END AS warranty_status,
  pp.warranty_end_date - CURRENT_DATE AS days_remaining,

  pw.name AS physical_warehouse_name,
  pw.code AS physical_warehouse_code,

  st.id AS current_ticket_id,
  st.ticket_number AS current_ticket_number,
  st.status AS current_ticket_status,

  pp.created_at,
  pp.updated_at

FROM physical_products pp
JOIN products p ON pp.product_id = p.id
JOIN brands b ON p.brand_id = b.id
LEFT JOIN physical_warehouses pw ON pp.physical_warehouse_id = pw.id
LEFT JOIN service_tickets st ON pp.current_ticket_id = st.id

WHERE pp.warranty_end_date IS NOT NULL
  AND pp.warranty_end_date > CURRENT_DATE
  AND pp.warranty_end_date <= CURRENT_DATE + INTERVAL '30 days'

ORDER BY pp.warranty_end_date ASC;
```

---

### tRPC API Procedures

All warehouse operations are exposed via type-safe tRPC procedures.

#### Warehouse Router (`src/server/routers/warehouse.ts`)

**1. listPhysicalWarehouses**
```typescript
Input: { is_active?: boolean }
Returns: PhysicalWarehouse[]
Permission: All authenticated users
```

**2. createPhysicalWarehouse**
```typescript
Input: { name, location, description?, is_active }
Returns: PhysicalWarehouse
Permission: Admin, Manager
Validation: name min 1 char, location min 1 char
```

**3. updatePhysicalWarehouse**
```typescript
Input: { id, name?, location?, description?, is_active? }
Returns: PhysicalWarehouse
Permission: Admin, Manager
```

**4. deletePhysicalWarehouse**
```typescript
Input: { id }
Returns: PhysicalWarehouse (soft deleted, is_active=false)
Permission: Admin, Manager
Validation: Cannot delete if products exist
```

**5. listVirtualWarehouses**
```typescript
Input: none
Returns: VirtualWarehouse[]
Permission: All authenticated users
Note: Read-only, virtual warehouses are system-defined
```

---

#### Inventory Router (`src/server/routers/inventory.ts`)

**Product Management:**

**1. createProduct**
```typescript
Input: {
  serial_number, product_id, physical_warehouse_id?,
  virtual_warehouse_type, condition,
  warranty_start_date?, warranty_months?,
  purchase_date?, supplier_id?, supplier_name?,
  purchase_price?, notes?, photo_urls?
}
Returns: PhysicalProduct
Permission: All authenticated users
Validation: serial uniqueness, uppercase conversion
```

**2. updateProduct**
```typescript
Input: { id, ...update fields }
Returns: PhysicalProduct
Permission: All authenticated users
Validation: serial uniqueness if changed
```

**3. listProducts**
```typescript
Input: {
  physical_warehouse_id?, virtual_warehouse_type?,
  condition?, warranty_status?,
  search?, limit, offset
}
Returns: { products: PhysicalProduct[], total: number }
Permission: All authenticated users
Features: Pagination, filtering, search
```

**4. getProduct**
```typescript
Input: { id?, serial_number? }
Returns: PhysicalProductWithDetails
Permission: All authenticated users
Note: Fetch by ID or serial number
```

**5. bulkImport**
```typescript
Input: { products: PhysicalProductFormData[] }
Returns: {
  total, success_count, error_count,
  success: PhysicalProduct[],
  errors: { row, serial, error }[]
}
Permission: All authenticated users
Validation: Batch duplicate detection, serial uniqueness
```

---

**Stock Movement:**

**6. verifySerial**
```typescript
Input: { serial_number }
Returns: {
  found: boolean,
  product?, warranty, location, inService, currentTicket?
}
Permission: All authenticated users
Note: Real-time warranty and location lookup
```

**7. recordMovement**
```typescript
Input: {
  product_id, movement_type,
  from_physical_warehouse_id?, to_physical_warehouse_id?,
  from_virtual_warehouse_type?, to_virtual_warehouse_type?,
  reference_ticket_id?, notes?, force?
}
Returns: { success: boolean }
Permission: Admin, Manager, Technician
Validation: Product not in service (unless force)
```

**8. getMovementHistory**
```typescript
Input: { product_id, limit, offset }
Returns: { movements: StockMovement[], total: number }
Permission: All authenticated users
Features: Pagination, full details
```

**9. assignToTicket**
```typescript
Input: { serial_number, ticket_id }
Returns: { success: boolean }
Permission: All authenticated users
Note: Moves product to in_service
```

---

**Stock Levels:**

**10. getStockLevels**
```typescript
Input: {
  warehouse_type?, status?, search?, limit, offset
}
Returns: { stockLevels: WarehouseStockLevel[], total: number }
Permission: Admin, Manager
Note: Refreshes materialized view before query
```

**11. setThreshold**
```typescript
Input: {
  product_id, warehouse_type,
  minimum_quantity, reorder_quantity?, alert_enabled
}
Returns: { success: boolean }
Permission: Admin, Manager
Validation: quantities >= 0, reorder >= minimum
```

**12. getLowStockAlerts**
```typescript
Input: none
Returns: {
  alerts: LowStockAlert[],
  criticalCount, warningCount
}
Permission: Admin, Manager
Note: Filters warning/critical, sorted by severity
```

**13. exportStockReport**
```typescript
Input: { warehouse_type?, status? }
Returns: { csv: string, filename: string }
Permission: Admin, Manager
Note: CSV format with current date in filename
```

---

**RMA Operations:**

**14. createRMABatch**
```typescript
Input: {
  supplier_name, shipping_date?, tracking_number?, notes?
}
Returns: RMABatch
Permission: Admin, Manager
```

**15. addProductsToRMA**
```typescript
Input: { batch_id, product_ids: UUID[] }
Returns: { success: boolean, added: number, errors?: string[] }
Permission: Admin, Manager
Note: Auto-moves products to rma_staging
```

**16. finalizeRMABatch**
```typescript
Input: { batch_id, shipping_date?, tracking_number? }
Returns: RMABatch
Permission: Admin, Manager
Validation: Batch must have products, must be in draft
```

**17. getRMABatches**
```typescript
Input: { status?, limit, offset }
Returns: { batches: RMABatch[], total: number }
Permission: Admin, Manager
Features: Pagination, status filter, product count
```

**18. getRMABatchDetails**
```typescript
Input: { batch_id }
Returns: { batch: RMABatch, products: PhysicalProduct[] }
Permission: Admin, Manager
```

---

### UI Components

#### Pages

**1. Warehouses Management** (`/warehouses`)
- Tabbed interface: Physical | Virtual
- Physical warehouse table with CRUD
- Virtual warehouse table (read-only)
- Search and filter capabilities
- Color-coded warehouse types

**2. Stock Levels Dashboard** (`/dashboard/inventory/stock-levels`)
- Alert banner (critical/warning)
- Stats cards (total, warnings, critical)
- Filters: warehouse type, status, search
- Stock levels table with status badges
- CSV export button
- Set threshold modal

**3. Product Inventory** (`/dashboard/inventory`)
- Product registration modal
- Bulk import modal
- Product inventory table
- Filters: warehouse, condition, warranty status
- Serial verification widget

**4. RMA Management** (`/dashboard/inventory/rma`)
- RMA batch list
- Create batch modal
- Add products to batch
- Batch details view
- Finalize batch workflow

---

#### Shared Components

**1. SerialVerificationWidget**
- Location: `src/components/shared/serial-verification-widget.tsx`
- Real-time serial lookup
- Warranty status badge
- Location display
- In-service alert
- Product photo preview

**2. MovementHistoryTimeline**
- Location: `src/components/shared/movement-history-timeline.tsx`
- Chronological timeline view
- Movement type icons
- From → To locations
- User and date information
- Ticket references

**3. StockStatusBadge**
- Location: `src/components/shared/stock-status-badge.tsx`
- Color-coded badges (ok/warning/critical)
- Stock count display
- Threshold ratio

**4. RecordMovementModal**
- Location: `src/components/modals/record-movement-modal.tsx`
- Movement type selector
- From/To warehouse pickers
- Validation: product in service
- Notes and reason fields

**5. WarehouseFormModal**
- Location: `src/components/warehouse/warehouse-form-modal.tsx`
- Create/Edit modes
- Name, location, description fields
- Active status toggle
- Validation feedback

---

### Permissions

Warehouse operations require specific role-based permissions:

| Operation | Admin | Manager | Technician | Reception |
|-----------|-------|---------|------------|-----------|
| View warehouses | ✓ | ✓ | ✓ | ✓ |
| Create physical warehouse | ✓ | ✓ | - | - |
| Edit physical warehouse | ✓ | ✓ | - | - |
| Delete physical warehouse | ✓ | - | - | - |
| Register products | ✓ | ✓ | ✓ | ✓ |
| Move products | ✓ | ✓ | ✓ | - |
| Dispose products | ✓ | ✓ | - | - |
| View all movements | ✓ | ✓ | Own only | Own only |
| Export stock reports | ✓ | ✓ | - | - |
| Bulk import | ✓ | ✓ | - | - |
| Set thresholds | ✓ | ✓ | - | - |
| Create RMA batches | ✓ | ✓ | - | - |

---

## Best Practices

### Product Registration

**1. Serial Number Standards**
- Use uppercase alphanumeric format
- Include product type prefix (e.g., `MAC-`, `IPHONE-`)
- Verify serial before registration
- Take photos immediately upon receipt

**2. Warranty Information**
- Always capture warranty start date for new products
- Verify manufacturer warranty length
- Set up warranty expiration alerts
- Review expiring warranties monthly

**3. Bulk Import**
- Validate CSV format before upload
- Test with small batch first (10-20 items)
- Review error report carefully
- Re-import failed items after correction

### Stock Management

**1. Movement Recording**
- Always provide meaningful notes
- Link to ticket when applicable
- Use correct movement type
- Take before/after photos for high-value items

**2. Warehouse Organization**
- Create logical physical warehouse structure
- Use consistent naming conventions
- Label storage locations physically
- Conduct periodic audits

**3. Virtual Warehouse Usage**
- Warranty Stock: Only products with active warranty
- RMA Staging: Products awaiting return decision
- Dead Stock: Non-repairable items only
- In Service: Automatic, do not manually move
- Parts: Component-level items

### Threshold Management

**1. Setting Thresholds**
- Base on historical usage patterns
- Consider lead time for reordering
- Set higher thresholds for high-demand items
- Review and adjust quarterly

**2. Alert Response**
- Check critical alerts daily
- Place orders when reaching reorder quantity
- Investigate unusual consumption patterns
- Document threshold changes

**3. Monitoring**
- Review low stock report weekly
- Export reports for management review
- Track trends over time
- Adjust thresholds based on demand

### RMA Operations

**1. Batch Creation**
- Group by supplier and time period
- Include detailed notes about defects
- Take photos before shipping
- Track shipping information

**2. Product Selection**
- Only include products with supplier warranty
- Verify defect before adding to batch
- Document failure mode
- Remove non-defective items

**3. Batch Finalization**
- Verify product count
- Confirm shipping details
- Update tracking number
- Monitor return status

### Data Quality

**1. Regular Audits**
- Quarterly physical inventory count
- Reconcile system vs. physical stock
- Review movement history for anomalies
- Clean up inactive warehouses

**2. Documentation**
- Maintain clear notes on all movements
- Document reasons for disposals
- Track supplier return outcomes
- Keep warranty documentation

**3. Photo Management**
- Capture multiple angles for registration
- Update photos if condition changes
- Include serial number in photo
- Use consistent background/lighting

### Performance Optimization

**1. Query Performance**
- Use filters to limit result sets
- Leverage pagination for large lists
- Refresh materialized view during off-peak
- Monitor slow queries

**2. Bulk Operations**
- Import during off-peak hours
- Batch movements when possible
- Use bulk import for 50+ products
- Schedule periodic maintenance

**3. Storage Management**
- Archive old movement records annually
- Compress product photos
- Clean up duplicate serials
- Remove obsolete warehouses

---

## Related Documentation

- **Story 1.6**: [Warehouse Hierarchy Setup](/home/tan/work/sevice-center/docs/stories/01.06.warehouse-hierarchy-setup.md)
- **Story 1.7**: [Physical Product Master Data](/home/tan/work/sevice-center/docs/stories/01.07.physical-product-master-data.md)
- **Story 1.8**: [Serial Verification and Stock Movements](/home/tan/work/sevice-center/docs/stories/01.08.serial-verification-and-stock-movements.md)
- **Story 1.9**: [Warehouse Stock Levels and Low Stock Alerts](/home/tan/work/sevice-center/docs/stories/01.09.warehouse-stock-levels-and-low-stock-alerts.md)
- **Story 1.10**: [RMA Batch Operations](/home/tan/work/sevice-center/docs/stories/01.10.rma-batch-operations.md)
- **Architecture**: [Coding Standards](/home/tan/work/sevice-center/docs/architecture/coding-standards.md)
- **Architecture**: [Tech Stack](/home/tan/work/sevice-center/docs/architecture/tech-stack.md)

---

## Appendix

### Common Workflows

**A. Receiving New Products**
1. Create products in system (single or bulk import)
2. Assign to warranty_stock virtual warehouse
3. Place in physical warehouse location
4. Record receipt movement
5. Verify serial numbers
6. Upload product photos

**B. Processing Service Ticket**
1. Customer brings product for service
2. Verify serial number (warranty check)
3. Create service ticket with serial
4. System automatically moves to in_service
5. Technician completes repair
6. Update ticket status to completed
7. System automatically returns to warranty_stock
8. Product available for next customer

**C. Handling Defective Products**
1. Identify defective product
2. Verify supplier warranty
3. Create RMA batch
4. Add product to batch
5. Product automatically moves to rma_staging
6. Finalize batch with shipping info
7. Ship to supplier
8. Update batch status to shipped
9. Receive replacement
10. Register replacement in inventory

**D. Low Stock Response**
1. Check low stock alerts daily
2. Identify products below threshold
3. Review historical consumption
4. Calculate reorder quantity
5. Place supplier order
6. Update threshold if needed
7. Receive products
8. Register in inventory
9. Alert clears automatically

---

## FAQ

**Q: What happens if I manually move a product that's in service?**
A: The system prevents this by default. If you use the force flag, you'll break the ticket-product association and lose audit trail consistency. Always complete or cancel the ticket first.

**Q: Can I delete a virtual warehouse?**
A: No, virtual warehouses are system-defined and cannot be deleted or modified. They are core to the inventory management logic.

**Q: Why is my stock level not updating immediately?**
A: The stock levels view is materialized for performance. It refreshes before each query, but there may be a small delay. For real-time accuracy, query physical_products directly.

**Q: How do I handle products without serial numbers?**
A: This system requires serial numbers for all products. For products without manufacturer serials, create internal serial numbers using a consistent format (e.g., `INTERNAL-2025-001`).

**Q: Can I modify a stock movement after it's created?**
A: No, stock movements are immutable for audit trail integrity. If you made an error, create a correction movement with notes explaining the correction.

**Q: What happens to products when a ticket is cancelled?**
A: Currently, only the 'completed' status triggers automatic return. For cancelled tickets, manually move the product back to the appropriate warehouse.

**Q: How do I track warranty for products without warranty?**
A: Leave warranty_start_date and warranty_months as NULL. The system will report warranty_status as 'unknown' and won't generate expiration alerts.

**Q: Can I export movement history?**
A: Yes, use the CSV export feature on the Stock Levels Dashboard. You can also query the v_stock_movement_history view directly for custom reports.

---

**End of Document**
