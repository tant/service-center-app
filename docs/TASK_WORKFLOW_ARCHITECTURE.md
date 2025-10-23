# Task & Workflow Architecture

**Version:** 3.0
**Business:** ZOTAC & SSTC Authorized Service Center
**Purpose:** Service Request & Task Management với workflow linh hoạt

---

## Business Overview

### Sản Phẩm
- **ZOTAC:** Graphics Cards, Mini PCs, Motherboards
- **SSTC:** SSD/NVMe, RAM, Barebone PC

### Đặc Điểm Sản Phẩm
- **Repairable:** Mini PCs, Barebone PCs, GPUs (fan, thermal issues)
- **Non-Repairable:** SSD/NVMe (controller failure), RAM (chip failure), GPU core/VRAM damage

### Service Types & Decisions

**Không còn phân chia cứng nhắc "Warranty" vs "Repair"**

Thay vào đó, workflow linh hoạt dựa trên:

```
Customer brings/ships product(s)
    ↓
Create Service Request (1 hoặc nhiều sản phẩm)
    ↓
For each product → Create Service Ticket
    ↓
Diagnosis & Warranty Check
    ↓
┌──────────────────┴─────────────────────┐
│                                         │
├─ CÒN BẢO HÀNH                          ├─ HẾT BẢO HÀNH
│  ├─ Repair (Warranty - Free)           │  ├─ Repair (Paid)
│  ├─ Replace/RMA (Free)                 │  ├─ Goodwill Repair (Free)
│  └─ Không BH* (phát hiện sau)          │  └─ Customer Decline → Cancel
│                                         │
└─────────────────┬─────────────────────┘
                  ↓
            Execute Tasks
                  ↓
            Complete & Return

* Không BH: Seal broken, physical damage, misuse...
  → Chuyển sang Paid hoặc Goodwill
```

---

## Core Architecture

### Concept: 3-Layer Model

```
┌─────────────────────────────────────────────────┐
│  SERVICE REQUEST (Phiếu Yêu Cầu Dịch Vụ)        │
│  - Container cho 1 hoặc NHIỀU sản phẩm          │
│  - Tạo từ Public (customer) hoặc Internal       │
│  - Track: submission → completion               │
│  - Có thể link shipment (nếu remote)            │
└─────────────────┬───────────────────────────────┘
                  │ 1:N
        ┌─────────┴─────────┐
        │                   │
┌───────▼─────────┐   ┌────▼──────────┐
│ SERVICE TICKET  │   │ SERVICE TICKET│
│ (1 sản phẩm)    │   │ (1 sản phẩm)  │
│                 │   │               │
│ - Workflow      │   │ - Workflow    │
│ - Status        │   │ - Status      │
└───────┬─────────┘   └────┬──────────┘
        │ 1:N              │ 1:N
┌───────▼─────────┐   ┌────▼──────────┐
│ SERVICE TASKS   │   │ SERVICE TASKS │
│ - Reception     │   │ - Reception   │
│ - Diagnosis     │   │ - Diagnosis   │
│ - Repair        │   │ - Repair      │
│ - Testing       │   │ - Testing     │
└─────────────────┘   └───────────────┘
```

**Key Principles:**
- 1 Service Request = 1 customer submission (có thể nhiều products)
- 1 Service Ticket = 1 product (giữ nguyên principle này)
- 1 Service Ticket → N Tasks (workflow breakdown)

---

## Data Model Overview

### 1. Service Requests (NEW - Layer 1)

**Purpose:** Container cho customer submissions

**Main Fields:**
```
service_requests
├─ request_number          # SR-2025-001 (auto-generated)
├─ customer_id
├─ intake_method           # 'walk_in' | 'remote' | 'public_form'
├─ intake_source           # 'staff' | 'customer_portal' | 'email' | 'phone'
├─ submission_date
├─ expected_products_count # Số sản phẩm khách báo trước
├─ actual_products_count   # Số sản phẩm thực tế tiếp nhận
├─ status                  # 'submitted' | 'received' | 'processing' | 'completed' | 'cancelled'
├─ shipment_id (optional)  # Link to shipment nếu remote
├─ notes
└─ metadata (JSONB)        # Flexible data
```

**Status Flow:**
```
submitted   → Customer/staff tạo request
    ↓
received    → Đã nhận sản phẩm (for remote) hoặc skip (for walk-in)
    ↓
processing  → Đang xử lý (≥1 ticket in progress)
    ↓
completed   → Tất cả tickets hoàn tất
cancelled   → Hủy
```

---

### 2. Service Tickets (Modified - Layer 2)

**Purpose:** Quản lý từng sản phẩm cụ thể

**Main Fields:**
```
service_tickets
├─ ticket_number           # SV-2025-123
├─ service_request_id      # Link to request (NEW)
├─ product_index           # Product #1, #2... trong request (NEW)
├─ customer_id
├─ product_type            # 'gpu', 'ssd', 'ram', 'minipc'...
├─ brand, model, serial_number
│
├─ intake_method           # Inherited from request
│
├─ warranty_status         # 'unknown' | 'valid' | 'expired' | 'void'
├─ is_repairable           # TRUE | FALSE | NULL (chưa biết)
│
├─ service_decision        # (NEW - Flexible!)
│  # 'warranty_repair'     → Sửa miễn phí (BH)
│  # 'warranty_replace'    → Đổi/RMA (BH)
│  # 'paid_repair'         → Sửa trả phí
│  # 'goodwill_repair'     → Sửa miễn phí (hết BH nhưng goodwill)
│  # 'customer_declined'   → Khách từ chối
│  # 'non_repairable'      → Không sửa được
│
├─ charge_amount           # 0 for warranty/goodwill, >0 for paid
├─ quote_amount            # Báo giá ban đầu (for paid)
│
├─ has_subtasks            # TRUE → enable task workflow
├─ overall_progress        # 0-100% (auto-calculated)
│
├─ status                  # 'pending' | 'in_progress' | 'completed' | 'cancelled'
└─ metadata (JSONB)
```

**Key Changes:**
- ❌ Removed rigid `service_type` ('warranty' | 'repair')
- ✅ Added flexible `service_decision` (nhiều options)
- ✅ Added `service_request_id` để link nhiều tickets
- ✅ `warranty_status` + `service_decision` = linh hoạt hơn

---

### 3. Service Tasks (Unchanged - Layer 3)

**Purpose:** Breakdown công việc cho từng ticket

**Main Fields:**
```
service_tasks
├─ ticket_id
├─ task_number             # 1, 2, 3...
├─ task_name
├─ task_type               # Validated via task_type_definitions
├─ assigned_to
├─ status                  # 'pending' | 'in_progress' | 'completed' | 'blocked'
├─ dependencies (JSONB)    # [1, 2] = depends on task 1, 2
├─ sequence_order
├─ result_data (JSONB)     # Test results, findings
├─ metadata (JSONB)
├─ estimated_hours
└─ actual_hours
```

---

### 4. Shipments (Optional - For Remote)

**Purpose:** Track shipping cho remote requests

**Main Fields:**
```
shipments
├─ shipment_number         # SHP-2025-001
├─ service_request_id      # Link to request (1:1)
├─ tracking_number
├─ shipping_provider       # 'VNPost', 'GHN'...
├─ expected_arrival_date
├─ received_date
├─ status                  # 'in_transit' | 'received'
├─ unboxing_photos (Array)
└─ notes
```

---

## Task Type Definitions (Extensible)

### Core Task Types

```
Task Types:
├─ reception_intake        → Tiếp nhận, scan serial, chụp ảnh
├─ initial_inspection      → Kiểm tra sơ bộ (seal, damage)
├─ deep_diagnosis          → Chẩn đoán chuyên sâu (benchmark, test)
├─ warranty_check          → Kiểm tra điều kiện bảo hành
├─ quote_creation          → Lập báo giá (for paid repair)
├─ manager_approval        → Manager phê duyệt
├─ customer_decision       → Chờ khách quyết định (accept quote/goodwill)
├─ repair                  → Sửa chữa thực tế
├─ replacement             → Đổi sản phẩm
├─ warehouse_out           → Xuất kho
├─ warehouse_in            → Nhập kho
├─ rma_processing          → Xử lý RMA với hãng
├─ testing                 → Testing/QC sau repair
├─ customer_notification   → Thông báo khách
├─ payment_collection      → Thu phí (for paid)
├─ delivery                → Giao/trả hàng
└─ await_shipment          → Chờ nhận hàng (for remote)
```

**Extensibility:**
- Task types stored trong `task_type_definitions` table
- Không hardcode, có thể thêm mới qua UI
- Validate via application logic

---

## Workflow Examples

### Example 1: Walk-In - Single Product - Warranty Valid

**Scenario:** Khách mang GPU đến trực tiếp, còn BH, sửa được

```
STEP 1: Create Service Request
  intake_method = 'walk_in'
  intake_source = 'staff'
  expected_products_count = 1
  status = 'received' (skip 'submitted' vì đã có sản phẩm)

STEP 2: Create Service Ticket (from request)
  product: ZOTAC RTX 4080
  serial: ZT-D40800D-10P-12345
  issue: Fan không quay
  status = 'pending'
  warranty_status = 'unknown' (chưa check)

STEP 3: Instantiate Tasks (from template)
  Task 1: Reception Intake (0.25h)
  Task 2: Initial Inspection (0.5h)
  Task 3: Deep Diagnosis (1h)
  Task 4: Warranty Check (0.25h)
  Task 5: Manager Approval (blocked, đợi result)
  Task 6: Repair (blocked)
  Task 7: Testing (blocked)
  Task 8: Notify Customer (blocked)

STEP 4: Execute Tasks
  Task 1 → completed: Photos taken, serial confirmed
  Task 2 → completed: Seal OK, fan 2 stuck
  Task 3 → completed:
    result_data = {
      "tool": "Furmark",
      "fan_2_rpm": 0,
      "max_temp": 92,
      "is_repairable": true
    }
    → Update ticket: is_repairable = TRUE

  Task 4 → completed:
    result_data = {
      "warranty_status": "valid",
      "serial_valid": true,
      "purchase_date": "2024-03-15",
      "warranty_until": "2026-03-15"
    }
    → Update ticket: warranty_status = 'valid'

  → Unlock Task 5

  Task 5 (Manager Approval):
    Manager reviews: "Approve warranty repair"
    → Update ticket: service_decision = 'warranty_repair'
    → Unlock Task 6

  Task 6 (Repair): Replace fan, thermal paste (2h)

  Task 7 (Testing): Furmark 30min, all fans OK, temp 68°C

  Task 8 (Notify): Call/SMS customer

STEP 5: Complete
  Ticket status = 'completed'
  Request status = 'completed'
  charge_amount = 0 (warranty)
```

**Timeline:** 1.5 days
**Cost:** 0 VND (warranty)

---

### Example 2: Remote - Multiple Products - Mixed Scenarios

**Scenario:** Khách Đà Nẵng gửi 2 sản phẩm (1 GPU + 1 SSD)

```
STEP 1: Customer submits request (Public Portal)
  Customer fills form:
    - Name, Phone, Email, Address
    - Product 1: GPU RTX 4080, Serial: xxx, Issue: Fan noise
    - Product 2: SSD 1TB, Serial: yyy, Issue: Not detected
    - Shipping: VNPost, Tracking: VNP123456

  System creates:
    Service Request SR-2025-001
      intake_method = 'remote'
      intake_source = 'customer_portal'
      expected_products_count = 2
      status = 'submitted'

    Service Ticket SV-2025-150 (GPU)
      service_request_id = SR-2025-001
      product_index = 1
      status = 'pending'
      warranty_status = 'unknown'

    Service Ticket SV-2025-151 (SSD)
      service_request_id = SR-2025-001
      product_index = 2
      status = 'pending'
      warranty_status = 'unknown'

    Shipment SHP-2025-001
      service_request_id = SR-2025-001
      tracking_number = VNP123456
      status = 'in_transit'

    For each ticket, create tasks:
      Task 1: Await Shipment (status = 'in_progress')
      Task 2-8: Normal workflow (status = 'blocked')

  Email to customer:
    "Request SR-2025-001 created with 2 tickets:
     - SV-2025-150 (GPU)
     - SV-2025-151 (SSD)
     Track at: https://portal.com/track/SR-2025-001"

STEP 2: Shipment Arrives (2 days later)
  Staff scans tracking VNP123456
  → System finds Shipment SHP-2025-001
  → Shows linked request SR-2025-001 and tickets

  Staff unboxes:
    Product 1: GPU, Serial matches → Confirm
    Product 2: SSD, Serial matches → Confirm
    Photos uploaded

  System updates:
    Shipment status = 'received'
    Request status = 'received'
    Both tickets status = 'received'
    All "Await Shipment" tasks → completed
    Unlock next tasks

STEP 3: Process GPU (SV-2025-150)
  Reception → Inspection → Diagnosis → Warranty Check

  Result:
    warranty_status = 'valid'
    is_repairable = true

  Manager Approval:
    service_decision = 'warranty_repair'

  Repair → Testing → Notify

  Complete: charge_amount = 0

STEP 4: Process SSD (SV-2025-151)
  Reception → Inspection → Diagnosis

  Result:
    is_repairable = false (controller failure)

  Warranty Check:
    warranty_status = 'valid'

  Manager Approval:
    service_decision = 'warranty_replace'

  Tasks:
    - Warehouse OUT (new SSD)
    - Warehouse IN (faulty SSD → RMA)
    - Testing (new SSD)
    - Notify

  Complete: charge_amount = 0

STEP 5: All Complete
  Both tickets completed
  → Request status = 'completed'

  Email to customer:
    "Your request SR-2025-001 is completed:
     - GPU: Repaired (fan replaced)
     - SSD: Replaced with new unit
     Total: 0 VND (warranty)
     Ready for return shipment"
```

**Timeline:** 3 days
**Cost:** 0 VND (all warranty)

---

### Example 3: Warranty Expired → Goodwill Decision

**Scenario:** GPU hết BH 2 tháng, khách loyalty, manager approve goodwill

```
STEP 1-3: Normal flow (Request → Ticket → Tasks)

STEP 4: Diagnosis & Warranty Check
  warranty_check task:
    result_data = {
      "warranty_status": "expired",
      "expired_date": "2024-08-15",
      "days_expired": 68
    }

  → Update ticket: warranty_status = 'expired'

STEP 5: Manager Decision
  Manager reviews:
    - Customer loyalty: 5 previous services
    - Simple repair: Fan replacement only
    - Product value: High-end GPU

  Decision: "Approve Goodwill Repair"

  → Update ticket: service_decision = 'goodwill_repair'
  → charge_amount = 0
  → Create task: "Customer Notification (Goodwill)"

STEP 6: Notify Customer
  "Good news! Mặc dù sản phẩm đã hết BH 2 tháng,
   nhưng do anh là khách quen, chúng tôi sẽ sửa
   miễn phí cho anh lần này."

  Customer: Accept (happy!)

STEP 7: Repair → Testing → Complete
  charge_amount = 0 (goodwill)

  metadata = {
    "goodwill_reason": "loyal_customer",
    "original_warranty_expired": "2024-08-15"
  }
```

---

### Example 4: Warranty Expired → Paid Repair

**Scenario:** SSD hết BH, khách chấp nhận trả phí

```
STEP 1-4: Same as Example 3 (Expired warranty detected)

STEP 5: Quote Creation
  Staff creates quote:
    - Diagnosis fee: 200,000 VND
    - Replacement SSD: 1,500,000 VND
    - Total: 1,700,000 VND

  Task: "Customer Decision (Accept Quote?)"
    status = 'blocked'

  Notify customer với quote

STEP 6: Customer Decision
  Customer accepts quote

  → Update ticket: service_decision = 'paid_repair'
  → charge_amount = 1,700,000
  → Unlock repair tasks

STEP 7: Execute Repair → Testing

STEP 8: Payment & Complete
  Task: "Payment Collection"
    Collect 1,700,000 VND
    Payment method: Cash/Transfer

  → Complete ticket
  → charge_amount = 1,700,000 (collected)
```

---

### Example 5: Warranty Check Failed (After Diagnosis)

**Scenario:** Khách claim BH, nhưng phát hiện seal broken

```
STEP 1-3: Normal flow
  Customer claims: "Còn BH, sửa miễn phí"

STEP 4: Deep Diagnosis
  Technician discovers:
    - Seal broken (user opened case)
    - Thermal paste replaced (not original)

  result_data = {
    "seal_status": "broken",
    "tampered": true,
    "evidence_photos": ["url1", "url2"]
  }

STEP 5: Warranty Check
  Serial valid, in warranty period BUT:
    warranty_status = 'void' (due to tampering)

STEP 6: Manager Review
  Contact customer:
    "Sản phẩm đã bị can thiệp (seal broken),
     không đủ điều kiện BH.

     Options:
     1. Paid Repair: 800,000 VND
     2. Goodwill (50% discount): 400,000 VND
     3. Decline & Return"

STEP 7: Customer Decision
  Option A: Accept goodwill
    → service_decision = 'goodwill_repair'
    → charge_amount = 400,000

  Option B: Decline
    → service_decision = 'customer_declined'
    → Cancel ticket
    → Return product as-is
```

---

## Workflow Rules & Templates

### Template Selection Logic

```typescript
function selectTemplate(ticket: ServiceTicket): Template {
  // Base template by intake method
  let template = ticket.intake_method === 'walk_in'
    ? 'walk_in_general'
    : 'remote_general';

  // Will be refined after diagnosis
  // Templates are flexible, tasks added/skipped based on:
  // - warranty_status
  // - is_repairable
  // - service_decision

  return template;
}
```

### Dynamic Task Instantiation

```typescript
function instantiateTasks(ticket: ServiceTicket) {
  let tasks = getBaseTasksFromTemplate(ticket);

  // Apply rules based on current state

  // After warranty_check completes:
  if (ticket.warranty_status === 'valid') {
    // Add manager approval task
    tasks.push({
      task_type: 'manager_approval',
      task_name: 'Manager phê duyệt BH'
    });
  }

  if (ticket.warranty_status === 'expired') {
    // Add quote creation + customer decision
    tasks.push(
      { task_type: 'quote_creation' },
      { task_type: 'customer_decision' }
    );
  }

  // After service_decision set:
  if (ticket.service_decision === 'warranty_replace') {
    // Skip repair, add warehouse tasks
    tasks = tasks.filter(t => t.task_type !== 'repair');
    tasks.push(
      { task_type: 'warehouse_out' },
      { task_type: 'warehouse_in' }
    );
  }

  if (ticket.service_decision === 'paid_repair') {
    // Add payment collection task
    tasks.push({ task_type: 'payment_collection' });
  }

  return tasks;
}
```

### Workflow Rules (Database-Driven)

```
workflow_rules table:
├─ Condition: warranty_status = 'expired'
│  Action: Add tasks ['quote_creation', 'customer_decision']
│
├─ Condition: service_decision = 'warranty_replace'
│  Action: Skip task 'repair', Add tasks ['warehouse_out', 'warehouse_in']
│
├─ Condition: service_decision = 'paid_repair'
│  Action: Add task 'payment_collection'
│
└─ Condition: is_repairable = false AND warranty_status = 'valid'
   Action: Set service_decision = 'warranty_replace'
```

---

## Intake Flows

### Flow 1: Public Portal (Customer Self-Service)

```
Customer visits portal → Fill form:
  ├─ Personal info
  ├─ Product(s) info (1 or more)
  │  ├─ Type, Brand, Model, Serial
  │  └─ Issue description
  └─ Shipping info (if remote)

Submit
  ↓
System creates:
  ├─ Service Request (status = 'submitted')
  ├─ Service Ticket(s) (1 per product)
  └─ Shipment (if remote)

Email confirmation với request & ticket numbers
  → Customer can track online
```

---

### Flow 2: Walk-In (Staff Creates)

```
Customer walks in with product(s)
  ↓
Staff creates Service Request:
  intake_method = 'walk_in'
  intake_source = 'staff'
  status = 'received' (skip submitted)
  ↓
For each product:
  Create Service Ticket
  Scan serial, take photos
  ↓
Instantiate tasks
  Skip "await_shipment" tasks
  Start with reception_intake
```

---

### Flow 3: Phone/Email (Staff Creates Remote)

```
Customer calls/emails
  ↓
Staff creates Service Request:
  intake_method = 'remote'
  intake_source = 'phone' or 'email'
  status = 'submitted'
  ↓
Staff collects product info
  → Create Service Tickets
  → Create Shipment record
  ↓
Provide request & ticket numbers to customer
  ↓
Wait for shipment arrival
  (Tasks include "await_shipment")
```

---

## Public Tracking (Customer Self-Service)

### Purpose
Khách hàng có thể tự tra cứu tình trạng phiếu yêu cầu dịch vụ mà không cần gọi điện.

### Tracking Method

**URL:** `https://service.center/track`

**Verification:**
```
Customer enters:
  ├─ Request Number: SR-2025-001
  └─ Phone Number: 0901234567
       (để verify ownership, bảo mật)

System validates:
  ├─ Request exists?
  ├─ Phone matches customer record?
  └─ If valid → Show tracking page
```

### Tracking Page Information

```
┌─────────────────────────────────────────────────┐
│  🔍 TRACKING: SR-2025-001                       │
│  Status: ĐANG XỬ LÝ                             │
├─────────────────────────────────────────────────┤
│  THÔNG TIN YÊU CẦU                              │
│  Ngày tiếp nhận: 20/10/2025                     │
│  Số sản phẩm: 2                                 │
│  Dự kiến hoàn tất: 24/10/2025 ⏰               │
│                                                  │
│  TIẾN TRÌNH                                     │
│  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━   │
│  ████████████████░░░░░░░░░░░░░░░░░░░░ 60%      │
│                                                  │
│  TIMELINE                                       │
│  ✅ 20/10 10:30 - Đã tiếp nhận yêu cầu          │
│  ✅ 22/10 09:00 - Đã nhận hàng (VNPost)         │
│  ✅ 22/10 14:00 - Đang kiểm tra và chẩn đoán    │
│  🔵 23/10 - Dự kiến hoàn tất kiểm tra           │
│  ⏳ 24/10 - Dự kiến hoàn tất sửa chữa           │
│  ⏳ 24/10 - Sẵn sàng giao trả                   │
│                                                  │
│  CHI TIẾT SẢN PHẨM                              │
│  ┌──────────────────────────────────────────┐  │
│  │ 📱 #1: ZOTAC RTX 4080 (SV-2025-150)       │  │
│  │ Tình trạng: Đang sửa chữa                 │  │
│  │ Tiến độ: ████████████░░░░ 75%             │  │
│  │ Dự kiến xong: 23/10/2025                  │  │
│  │ Ghi chú: Đang thay quạt tản nhiệt         │  │
│  └──────────────────────────────────────────┘  │
│                                                  │
│  ┌──────────────────────────────────────────┐  │
│  │ 💾 #2: SSTC NVMe 1TB (SV-2025-151)        │  │
│  │ Tình trạng: Đang kiểm tra                 │  │
│  │ Tiến độ: ██████░░░░░░░░░░ 45%             │  │
│  │ Dự kiến xong: 24/10/2025                  │  │
│  │ Ghi chú: Đang chạy test chuyên sâu        │  │
│  └──────────────────────────────────────────┘  │
│                                                  │
│  📧 Cập nhật qua Email: nguyenvana@email.com   │
│  📱 Hotline: 1900-xxxx (8h-18h)                │
└─────────────────────────────────────────────────┘
```

---

## Status Management

### Service Request Status

```
submitted   → Created, waiting for products (remote) or processing (walk-in)
received    → Products physically received (for remote)
processing  → ≥1 ticket being worked on
completed   → All tickets completed
cancelled   → Request cancelled
```

**Customer-Facing Messages:**
```
submitted   → "Đã tiếp nhận yêu cầu, chờ nhận hàng"
received    → "Đã nhận hàng, chuẩn bị kiểm tra"
processing  → "Đang xử lý"
completed   → "Hoàn tất, sẵn sàng giao trả"
cancelled   → "Đã hủy"
```

### Service Ticket Status

```
pending          → Created, waiting to start
received         → Product received (for remote), ready to process
in_progress      → ≥1 task in progress
awaiting_decision → Blocked on customer/manager decision
completed        → All tasks done, ready to return
cancelled        → Ticket cancelled
```

**Customer-Facing Messages:**
```
pending          → "Chờ xử lý"
received         → "Đã nhận sản phẩm"
in_progress      → "Đang kiểm tra/sửa chữa"
awaiting_decision → "Chờ phản hồi từ quý khách"
completed        → "Hoàn tất"
cancelled        → "Đã hủy"
```

### Task Status

```
pending      → Not started, may have dependencies
blocked      → Waiting for dependency or external input
in_progress  → Being worked on
completed    → Done
skipped      → Not needed (based on workflow rules)
```

---

## ETA & Progress Calculation

### Request-Level Progress

```typescript
// Auto-calculated từ tickets
function calculateRequestProgress(requestId: string): number {
  const tickets = getTicketsForRequest(requestId);

  const totalProgress = tickets.reduce((sum, ticket) => {
    return sum + ticket.overall_progress;
  }, 0);

  return totalProgress / tickets.length; // Average
}

// ETA: Lấy ticket có ETA xa nhất
function calculateRequestETA(requestId: string): Date {
  const tickets = getTicketsForRequest(requestId);

  const etas = tickets
    .map(t => t.estimated_completion_date)
    .filter(d => d != null);

  return max(etas); // Ticket nào xong muộn nhất
}
```

### Ticket-Level Progress

```typescript
// Auto-calculated từ tasks
function calculateTicketProgress(ticketId: string): number {
  const tasks = getTasksForTicket(ticketId);

  const completedTasks = tasks.filter(t => t.status === 'completed').length;
  const totalTasks = tasks.length;

  return (completedTasks / totalTasks) * 100;
}

// ETA: Tính từ estimated_hours của tasks còn lại
function calculateTicketETA(ticketId: string): Date {
  const tasks = getTasksForTicket(ticketId);

  // Tasks chưa hoàn thành
  const remainingTasks = tasks.filter(t =>
    t.status !== 'completed' && t.status !== 'skipped'
  );

  // Tổng giờ còn lại
  const remainingHours = remainingTasks.reduce((sum, task) => {
    return sum + (task.estimated_hours || 0);
  }, 0);

  // Assume 8 working hours/day
  const remainingDays = Math.ceil(remainingHours / 8);

  // Add to current date (skip weekends if needed)
  return addWorkingDays(new Date(), remainingDays);
}
```

### Timeline Generation

```typescript
// Generate customer-facing timeline
function generateTimeline(requestId: string): TimelineEvent[] {
  const request = getRequest(requestId);
  const tickets = getTickets(requestId);
  const shipment = getShipment(requestId);

  const events: TimelineEvent[] = [];

  // Event 1: Request created
  events.push({
    date: request.submission_date,
    status: 'completed',
    message: 'Đã tiếp nhận yêu cầu'
  });

  // Event 2: Shipment received (if remote)
  if (shipment && shipment.received_date) {
    events.push({
      date: shipment.received_date,
      status: 'completed',
      message: `Đã nhận hàng (${shipment.shipping_provider})`
    });
  }

  // Event 3-N: Current tasks in progress
  for (const ticket of tickets) {
    const currentTask = getCurrentTask(ticket.id);
    if (currentTask) {
      events.push({
        date: new Date(), // Now
        status: 'in_progress',
        message: currentTask.customer_description || 'Đang xử lý'
      });
    }
  }

  // Event N+1: Estimated completion
  const eta = calculateRequestETA(requestId);
  events.push({
    date: eta,
    status: 'pending',
    message: 'Dự kiến hoàn tất sửa chữa'
  });

  // Event N+2: Ready for return
  events.push({
    date: eta, // Same day
    status: 'pending',
    message: 'Sẵn sàng giao trả'
  });

  return events.sort((a, b) => a.date - b.date);
}
```

### Customer-Friendly Descriptions

**Mapping Internal → Customer:**

```typescript
const taskDescriptions = {
  // Internal → Customer-friendly
  'reception_intake': 'Tiếp nhận sản phẩm',
  'initial_inspection': 'Kiểm tra sơ bộ',
  'deep_diagnosis': 'Đang kiểm tra và chẩn đoán',
  'warranty_check': 'Kiểm tra điều kiện bảo hành',
  'quote_creation': 'Đang lập báo giá',
  'manager_approval': 'Đang xem xét',
  'customer_decision': 'Chờ phản hồi từ quý khách',
  'repair': 'Đang sửa chữa',
  'replacement': 'Đang đổi sản phẩm mới',
  'warehouse_out': 'Chuẩn bị sản phẩm thay thế',
  'warehouse_in': 'Xử lý sản phẩm lỗi',
  'testing': 'Đang kiểm tra chất lượng',
  'customer_notification': 'Chuẩn bị thông báo hoàn tất',
  'payment_collection': 'Chờ thanh toán',
  'delivery': 'Chuẩn bị giao trả',
  'await_shipment': 'Chờ nhận hàng từ quý khách'
};

function getCustomerFriendlyTaskDescription(task: ServiceTask): string {
  const baseDescription = taskDescriptions[task.task_type];

  // Add specific details from result_data or metadata
  if (task.task_type === 'repair' && task.metadata?.repair_type) {
    return `Đang ${task.metadata.repair_type}`;
    // VD: "Đang thay quạt tản nhiệt"
  }

  if (task.task_type === 'testing' && task.metadata?.test_type) {
    return `Đang chạy test ${task.metadata.test_type}`;
    // VD: "Đang chạy test hiệu năng"
  }

  return baseDescription;
}
```

### Privacy & Security

**Verification Logic:**

```typescript
// Public tracking endpoint
async function trackRequest(requestNumber: string, phoneNumber: string) {
  const request = await getRequestByNumber(requestNumber);

  if (!request) {
    throw new Error('Không tìm thấy phiếu yêu cầu');
  }

  const customer = await getCustomer(request.customer_id);

  // Verify phone number (last 4 digits hoặc full match)
  const phoneMatch =
    customer.phone === phoneNumber ||
    customer.phone.endsWith(phoneNumber.slice(-4));

  if (!phoneMatch) {
    throw new Error('Số điện thoại không khớp');
  }

  // Return tracking data (sanitized)
  return {
    request: sanitizeForCustomer(request),
    tickets: await getTicketsForCustomer(request.id),
    timeline: await generateTimeline(request.id),
    shipment: await getShipment(request.id)
  };
}

// Sanitize: Remove internal fields
function sanitizeForCustomer(request: ServiceRequest) {
  return {
    request_number: request.request_number,
    status: request.status,
    submission_date: request.submission_date,
    estimated_completion_date: request.estimated_completion_date,
    overall_progress_percentage: request.overall_progress_percentage,
    current_status_message: request.current_status_message,
    // ❌ Exclude: internal_notes, assigned_to, cost breakdown, etc.
  };
}
```

---

## Key Fields Summary

### Service Requests
- `request_number`, `customer_id`
- `intake_method`, `intake_source`
- `expected_products_count`, `actual_products_count`
- `status`, `metadata`
- **For Public Tracking:**
  - `estimated_completion_date` - Dự kiến hoàn tất
  - `current_status_message` - Thông báo tình trạng (customer-friendly)
  - `overall_progress_percentage` - % tiến độ tổng thể (0-100)

### Service Tickets
- `ticket_number`, `service_request_id`, `product_index`
- `product_type`, `brand`, `model`, `serial_number`
- `warranty_status` ('unknown' | 'valid' | 'expired' | 'void')
- `is_repairable` (boolean | null)
- `service_decision` (flexible enum):
  - `warranty_repair`, `warranty_replace`
  - `paid_repair`, `goodwill_repair`
  - `customer_declined`, `non_repairable`
- `charge_amount`, `quote_amount`
- `has_subtasks`, `overall_progress`
- `status`, `metadata`
- **For Public Tracking:**
  - `estimated_completion_date` - Dự kiến xong
  - `current_task_description` - Task đang làm (customer-friendly)
  - `public_notes` - Ghi chú cho khách (vs `internal_notes` cho staff)
  - `last_updated_at` - Lần cập nhật cuối

### Service Tasks
- `ticket_id`, `task_number`, `task_type`
- `assigned_to`, `status`
- `dependencies` (JSONB array)
- `result_data` (JSONB - test results, findings)
- `estimated_hours`, `actual_hours`
- `metadata`
- **For ETA Calculation:**
  - `estimated_completion_date` - Dự kiến xong task này
  - `is_customer_visible` - Hiển thị cho khách không (boolean)
  - `customer_description` - Mô tả task (customer-friendly, VD: "Đang kiểm tra phần cứng")

### Shipments (Optional)
- `shipment_number`, `service_request_id`
- `tracking_number`, `shipping_provider`
- `expected_arrival_date`, `received_date`
- `status`, `unboxing_photos`

---

## Extensibility

### 1. Task Types
- Stored in `task_type_definitions` table
- Add new types without code changes
- Manager can define via UI

### 2. Workflow Templates
- Stored in `task_templates` table
- Version control (keep old versions)
- Clone & modify via UI

### 3. Workflow Rules
- Stored in `workflow_rules` table
- Conditional logic (JSONB conditions)
- Enable/disable rules dynamically

### 4. Metadata Fields
- `metadata` JSONB in all tables
- Store custom data without schema changes
- Examples:
  - `goodwill_reason`
  - `discount_percentage`
  - `customer_loyalty_tier`
  - `external_claim_number`

### 5. Service Decisions
- Flexible enum (can add new options)
- Examples of future additions:
  - `express_repair` (paid premium)
  - `data_recovery_service`
  - `upgrade_service`

---

## Best Practices

### DO ✅
1. Always create Service Request first (even for walk-in)
2. Link all tickets to a request (for grouping)
3. Use metadata for custom fields
4. Version templates (never modify active ones)
5. Document workflow rules clearly
6. **Update ETA regularly** - Cập nhật `estimated_completion_date` khi có thay đổi
7. **Write customer-friendly notes** - Dùng `public_notes` riêng, `internal_notes` cho staff
8. **Update progress** - Mark tasks complete ngay để progress bar chính xác
9. **Provide tracking URL** - Gửi link tracking trong email xác nhận

### DON'T ❌
1. Don't create standalone tickets (always via request)
2. Don't hardcode service decisions
3. Don't skip warranty check task
4. Don't assume warranty status = service decision
5. Don't delete requests/tickets (mark cancelled instead)
6. **Don't expose internal info** - Không show internal_notes, cost breakdown cho khách
7. **Don't leave ETA empty** - Luôn cung cấp estimated_completion_date (có thể adjust sau)
8. **Don't use technical jargon** - Dùng customer-friendly language trong public_notes

---

## Migration Notes

### From Current System

```
Current: Direct Service Tickets
  customer → service_ticket → tasks

New: Service Request Layer
  customer → service_request → service_tickets → tasks

Migration:
  1. Add service_requests table
  2. For existing tickets:
     - Create service_request (1:1)
     - Link ticket to request
  3. Future tickets: Always create via request
```

---

## Summary

### Architecture
- **3-layer model:** Request → Ticket(s) → Task(s)
- **Flexible workflow:** Không còn rigid warranty vs repair
- **Multiple intake:** Public portal, walk-in, phone/email
- **Scalable:** 1 request nhiều products, batch processing

### Key Improvements
- ✅ Service Request = customer submission (1 or many products)
- ✅ Flexible service decisions (warranty, paid, goodwill...)
- ✅ Public portal support (submit request online)
- ✅ **Public tracking** (khách tra cứu bằng request# + phone)
- ✅ **ETA & Progress visibility** (customer-friendly timeline)
- ✅ Better remote service management
- ✅ Consistent workflow (walk-in cũng qua request)

### Next Steps
1. Implement Service Request layer
2. Refactor Ticket creation (always from request)
3. Build public portal (submit + tracking)
4. Implement ETA calculation logic
5. Update task templates với flexible rules
6. Create customer-friendly messaging system
7. Test với real scenarios

---

**Ready for implementation!** 🚀
