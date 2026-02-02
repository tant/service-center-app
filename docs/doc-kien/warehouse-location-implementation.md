# Kế Hoạch Implement: Vị Trí Kho Theo Quy Trình Sửa Chữa

## Tiến độ

| # | Hạng mục | Trạng thái |
|---|----------|------------|
| 1 | Mốc 1: Chuyển kho khi nhận hàng (`customer_installed` → `in_service`) | ✅ Done |
| 2 | Mốc 3: Transfer cho outcome `repaired` / `unrepairable` (`in_service` → `customer_installed`) | ✅ Done |
| 3 | Mốc 3: Sửa đích warranty (hỏng) từ `in_service` thành `rma_staging` | ✅ Done |

**Commit**: `13da446 feat: auto warehouse location transfers across service workflow`

---

## Gap Analysis

| Mốc | Tài liệu yêu cầu | Trước khi sửa | Sau khi sửa |
|-----|-------------------|---------------|-------------|
| Mốc 1 (nhận hàng) | → `in_service` | Không di chuyển | ✅ `customer_installed` → `in_service` |
| Mốc 3 - repaired | → `customer_installed` | Không di chuyển | ✅ `in_service` → `customer_installed` |
| Mốc 3 - unrepairable | → `customer_installed` | Không di chuyển | ✅ `in_service` → `customer_installed` |
| Mốc 3 - warranty (hỏng) | → `rma_staging` | → `in_service` (sai) | ✅ `in_service` → `rma_staging` |
| Mốc 3 - warranty (thay thế) | → `customer_installed` | ✅ Đúng | ✅ Giữ nguyên |

---

## File đã thay đổi

### 1. `src/server/routers/tickets.ts`

- **Export `createAutoTransfer`** — để dùng từ service-request router
- **`setOutcome` — outcome `repaired` / `unrepairable`**: Thêm block tạo transfer `in_service` → `customer_installed`
- **`setOutcome` — outcome `warranty_replacement`**: Sửa Transfer 2 từ `customer_installed → in_service` thành `in_service → rma_staging`, thêm lookup kho `rma_staging`

### 2. `src/server/routers/service-request.ts`

- **Import `createAutoTransfer`** từ tickets router
- **`submitRequest`**: Sau khi DB trigger tạo ticket (receipt_status = received), tự động chuyển sản phẩm `customer_installed` → `in_service`
- **`updateStatus`**: Tương tự khi staff thủ công đổi status sang `received`
- **`submitDraft`**: Tương tự khi submit draft có receipt_status = received

---

## Chi tiết thiết kế

### Mốc 1: Chuyển kho khi nhận hàng

**Thời điểm**: Sau khi `receipt_status` = `received` và DB trigger đã tạo ticket.

**Lý do chọn thời điểm này** (không phải lúc submit request): Vì đây là lúc sản phẩm đã thực sự được nhận và bắt đầu xử lý kỹ thuật.

**Approach**: Implement ở TypeScript (router) thay vì SQL trigger vì:
- `createAutoTransfer` đã có sẵn ở TypeScript
- Dễ debug, dễ maintain
- Consistent với code hiện tại

**Điều kiện**: Chỉ transfer khi sản phẩm đang ở `customer_installed`.

**Áp dụng tại 3 entry points**:
- `submitRequest` — public/staff submission
- `updateStatus` — staff thủ công đổi status
- `submitDraft` — submit từ draft

### Mốc 3: Transfer theo outcome

**Thời điểm**: Trong hàm `setOutcome`, sau khi update ticket status.

| Outcome | Transfer |
|---------|----------|
| `repaired` | `in_service` → `customer_installed` |
| `unrepairable` | `in_service` → `customer_installed` |
| `warranty_replacement` (hỏng) | `in_service` → `rma_staging` |
| `warranty_replacement` (thay thế) | `warranty_stock` → `customer_installed` (giữ nguyên) |
