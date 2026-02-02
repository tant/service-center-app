# Plan: Default Ticket Outcome + Edit Outcome

## Vấn đề
- Ticket tạo ra không có outcome (NULL) → trang chi tiết không hiển thị thông tin sản phẩm trả
- Không thể chỉnh outcome trên edit page
- DB constraint cũ yêu cầu `replacement_product_id NOT NULL` khi `outcome = 'warranty_replacement'` → không thể set default lúc tạo

## Thay đổi

### 1. DB constraint (relaxed)
- **File:** `docs/data/schemas/201_service_tickets.sql`
- **Migration:** `supabase/migrations/20260202175859_relax_outcome_constraint.sql`
- Constraint mới: `replacement_product_id IS NULL OR outcome = 'warranty_replacement'`
- Cho phép outcome = warranty_replacement mà chưa chọn sản phẩm thay thế

### 2. createTicket — default outcome
- **File:** `src/server/routers/tickets.ts`
- Thêm `outcome` vào schema (default: `warranty_replacement`)
- Set outcome khi insert ticket

### 3. updateTicket — cho phép sửa outcome
- **File:** `src/server/routers/tickets.ts`
- Thêm `outcome` vào updateTicketSchema
- Clear `replacement_product_id` khi outcome thay đổi khỏi `warranty_replacement`

### 4. Edit form — outcome selector
- **File:** `src/components/edit-ticket-form.tsx`
- Thêm Select với 3 options: Đổi bảo hành / Đã sửa / Không sửa được
- Grid layout đổi từ 3 cột sang 4 cột

## Luồng hoạt động
1. Tạo ticket → outcome = `warranty_replacement` (default)
2. Edit page → thay đổi outcome nếu cần
3. Detail page → hiển thị outcome read-only (code đã có sẵn)
4. setOutcome mutation → finalize với inventory movements (không thay đổi)
