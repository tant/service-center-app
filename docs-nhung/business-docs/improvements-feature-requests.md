# Product Improvements & Feature Requests

## Overview
Tài liệu này ghi nhận các đề xuất cải tiến và yêu cầu tính năng mới cho hệ thống Service Center App.

---

## 🎯 IMPROVEMENT #1: Thêm Contact Person vào Customer Master Data

**Ngày đề xuất:** 2026-02-05
**Người đề xuất:** Team
**Mức độ ưu tiên:** Medium
**Trạng thái:** Open

### 1. Tổng Quan

**Mô tả ngắn gọn:**
Bổ sung khả năng quản lý nhiều người liên hệ (contact persons) cho mỗi khách hàng trong Customer Master Data.

**Vấn đề hiện tại:**
- Hiện tại mỗi khách hàng chỉ có thể lưu 1 bộ thông tin liên hệ (tên, SĐT, email, địa chỉ)
- Khi tạo phiếu xuất (bán hàng), nếu thêm thông tin người liên hệ mới, thông tin này tự động ghi đè lên thông tin khách hàng hiện có
- Không có cách quản lý nhiều người liên hệ cho 1 khách hàng (VD: Công ty có nhiều nhân viên mua hàng)

**Tham chiếu:**
- [Test Cases - Issue Note](./test-cases-demo.md#L799-L803)

---

### 2. Business Justification

**Lợi ích kinh doanh:**

1. **Quản lý B2B tốt hơn**
   - Khách hàng doanh nghiệp thường có nhiều người liên hệ (IT Manager, Procurement, etc.)
   - Dễ dàng theo dõi ai đã mua hàng, ai là người liên hệ chính

2. **Lịch sử giao dịch rõ ràng**
   - Biết được từng giao dịch do người liên hệ nào thực hiện
   - Hỗ trợ customer service khi cần liên hệ lại

3. **Tránh nhầm lẫn dữ liệu**
   - Không bị ghi đè thông tin khi có người liên hệ mới
   - Dữ liệu khách hàng được bảo toàn

4. **Marketing & CRM**
   - Có thể gửi thông tin đến đúng người phụ trách
   - Theo dõi mối quan hệ với nhiều stakeholders

---

### 3. Proposed Solution

#### 3.1. Data Model Changes

**Customer Master Data (Hiện tại):**
```
Customer {
  id: UUID
  name: String
  phone: String (Primary Key)
  email: String (optional)
  address: String (optional)
  created_at: Timestamp
  updated_at: Timestamp
}
```

**Customer Master Data (Đề xuất):**
```
Customer {
  id: UUID
  company_name: String (NEW - tên công ty/tổ chức)
  phone: String (chính)
  email: String (chính)
  address: String (chính)
  customer_type: Enum ['individual', 'company'] (NEW)
  created_at: Timestamp
  updated_at: Timestamp
}

ContactPerson {
  id: UUID (NEW)
  customer_id: UUID (Foreign Key) (NEW)
  name: String (NEW)
  phone: String (NEW)
  email: String (optional) (NEW)
  position: String (optional) (NEW - VD: "IT Manager", "Giám đốc")
  is_primary: Boolean (NEW - người liên hệ chính)
  notes: Text (optional) (NEW)
  created_at: Timestamp (NEW)
  updated_at: Timestamp (NEW)
}
```

#### 3.2. Business Rules

1. **Khách hàng cá nhân (Individual):**
   - Có thể có 0-n người liên hệ
   - Nếu không có contact person riêng → dùng thông tin chính của customer

2. **Khách hàng doanh nghiệp (Company):**
   - Bắt buộc có ít nhất 1 contact person
   - Phải có 1 contact person được đánh dấu `is_primary = true`

3. **Khi tạo phiếu xuất (Sales):**
   - Cho phép chọn contact person từ danh sách
   - Hoặc thêm contact person mới → tự động thêm vào Customer Master
   - Lưu lại `contact_person_id` trong Stock Issue để tracking

4. **Validation:**
   - Phone của contact person phải unique trong phạm vi 1 customer
   - Mỗi customer chỉ có 1 primary contact person

---

### 4. UI/UX Requirements

#### 4.1. Customer Management Screen

**Màn hình "Quản lý Khách hàng":**

```
┌─────────────────────────────────────────────────┐
│ Quản lý Khách hàng: Công ty ABC                 │
├─────────────────────────────────────────────────┤
│ [Tab] Thông tin Chung  [Tab] Người liên hệ      │
│                                                  │
│ ┌─── Thông tin Công ty ────────────────────┐   │
│ │ Loại KH:      ○ Cá nhân  ● Doanh nghiệp  │   │
│ │ Tên công ty:  Công ty TNHH ABC           │   │
│ │ Điện thoại:   028-1234-5678              │   │
│ │ Email:        contact@abc.com            │   │
│ │ Địa chỉ:      123 Nguyễn Văn Linh...     │   │
│ └──────────────────────────────────────────┘   │
│                                                  │
│ ┌─── Danh sách Người liên hệ ──────────────┐   │
│ │ [+ Thêm người liên hệ]                   │   │
│ │                                           │   │
│ │ ┌────────────────────────────────────┐   │   │
│ │ │ ⭐ Nguyễn Văn A (Chính)            │   │   │
│ │ │ 📞 0912-345-678                    │   │   │
│ │ │ 📧 nguyenvana@abc.com              │   │   │
│ │ │ 💼 Giám đốc Kỹ thuật               │   │   │
│ │ │ [Sửa] [Xóa]                        │   │   │
│ │ └────────────────────────────────────┘   │   │
│ │                                           │   │
│ │ ┌────────────────────────────────────┐   │   │
│ │ │ Trần Thị B                         │   │   │
│ │ │ 📞 0923-456-789                    │   │   │
│ │ │ 📧 tranthib@abc.com                │   │   │
│ │ │ 💼 Trưởng phòng IT                 │   │   │
│ │ │ [Sửa] [Xóa] [Đặt làm chính]       │   │   │
│ │ └────────────────────────────────────┘   │   │
│ └───────────────────────────────────────────┘   │
└─────────────────────────────────────────────────┘
```

#### 4.2. Sales Order Screen (Phiếu xuất)

**Màn hình "Tạo Đơn Bán hàng" - Cải tiến:**

```
┌─────────────────────────────────────────────────┐
│ BƯỚC 2: Thông tin Khách hàng                     │
├─────────────────────────────────────────────────┤
│                                                  │
│ Tìm khách hàng:                                  │
│ ┌────────────────────────────────────────────┐  │
│ │ SĐT hoặc tên công ty... 🔍                │  │
│ └────────────────────────────────────────────┘  │
│                                                  │
│ ✅ Tìm thấy: Công ty TNHH ABC                    │
│                                                  │
│ Chọn người liên hệ:                              │
│ ┌────────────────────────────────────────────┐  │
│ │ ▼ Nguyễn Văn A - 0912-345-678 (Chính)     │  │
│ │   - Nguyễn Văn A - 0912-345-678 (Chính)   │  │
│ │   - Trần Thị B - 0923-456-789             │  │
│ │   - [+ Thêm người liên hệ mới...]         │  │
│ └────────────────────────────────────────────┘  │
│                                                  │
│ Thông tin người liên hệ:                         │
│ Tên:      Nguyễn Văn A                           │
│ SĐT:      0912-345-678                           │
│ Email:    nguyenvana@abc.com                     │
│ Chức vụ:  Giám đốc Kỹ thuật                      │
│                                                  │
│ [Tiếp tục] ───────────────────────────────────▶  │
└─────────────────────────────────────────────────┘
```

**Nếu chọn "Thêm người liên hệ mới":**

```
┌─────────────────────────────────────────────────┐
│ Thêm người liên hệ mới cho: Công ty TNHH ABC    │
├─────────────────────────────────────────────────┤
│                                                  │
│ Họ tên:        ┌──────────────────────────────┐ │
│                │ Lê Văn C                     │ │
│                └──────────────────────────────┘ │
│                                                  │
│ Số điện thoại: ┌──────────────────────────────┐ │
│ (bắt buộc)     │ 0934-567-890                 │ │
│                └──────────────────────────────┘ │
│                                                  │
│ Email:         ┌──────────────────────────────┐ │
│ (tùy chọn)     │ levanc@abc.com               │ │
│                └──────────────────────────────┘ │
│                                                  │
│ Chức vụ:       ┌──────────────────────────────┐ │
│ (tùy chọn)     │ Nhân viên IT                 │ │
│                └──────────────────────────────┘ │
│                                                  │
│ ☐ Đặt làm người liên hệ chính                    │
│                                                  │
│ Ghi chú:       ┌──────────────────────────────┐ │
│                │                              │ │
│                └──────────────────────────────┘ │
│                                                  │
│ [Hủy]  [Lưu & Tiếp tục]                          │
└─────────────────────────────────────────────────┘
```

---

### 5. Technical Implementation

#### 5.1. Database Migration

```sql
-- Bước 1: Thêm cột mới vào Customer
ALTER TABLE customers
ADD COLUMN customer_type VARCHAR(20) DEFAULT 'individual',
ADD COLUMN company_name VARCHAR(255);

-- Bước 2: Tạo bảng contact_persons
CREATE TABLE contact_persons (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    customer_id UUID NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    phone VARCHAR(20) NOT NULL,
    email VARCHAR(255),
    position VARCHAR(100),
    is_primary BOOLEAN DEFAULT FALSE,
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    -- Constraints
    UNIQUE(customer_id, phone),
    CHECK (customer_type IN ('individual', 'company'))
);

-- Bước 3: Index để tăng performance
CREATE INDEX idx_contact_persons_customer ON contact_persons(customer_id);
CREATE INDEX idx_contact_persons_primary ON contact_persons(customer_id, is_primary);

-- Bước 4: Trigger đảm bảo chỉ có 1 primary contact
CREATE OR REPLACE FUNCTION ensure_single_primary_contact()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.is_primary = TRUE THEN
        UPDATE contact_persons
        SET is_primary = FALSE
        WHERE customer_id = NEW.customer_id
        AND id != NEW.id;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_single_primary_contact
BEFORE INSERT OR UPDATE ON contact_persons
FOR EACH ROW
WHEN (NEW.is_primary = TRUE)
EXECUTE FUNCTION ensure_single_primary_contact();

-- Bước 5: Thêm cột contact_person_id vào stock_issues
ALTER TABLE stock_issues
ADD COLUMN contact_person_id UUID REFERENCES contact_persons(id);
```

#### 5.2. API Endpoints (Đề xuất)

```
GET    /api/customers/:id/contacts          # Lấy danh sách contacts
POST   /api/customers/:id/contacts          # Thêm contact mới
GET    /api/customers/:id/contacts/:cid     # Chi tiết 1 contact
PUT    /api/customers/:id/contacts/:cid     # Cập nhật contact
DELETE /api/customers/:id/contacts/:cid     # Xóa contact
PUT    /api/customers/:id/contacts/:cid/set-primary  # Đặt làm primary
```

#### 5.3. Backend Logic

**Validation Rules:**

1. Khi tạo customer type = 'company':
   - Bắt buộc phải có `company_name`

2. Khi thêm contact person:
   - Validate phone format
   - Check duplicate phone trong cùng customer
   - Nếu là contact đầu tiên → tự động set `is_primary = true`

3. Khi xóa contact person:
   - Không cho xóa nếu là primary contact duy nhất của company
   - Hiển thị warning nếu contact đã được dùng trong stock issues

---

### 6. Migration Strategy (Dữ liệu Cũ)

**Chiến lược chuyển đổi dữ liệu hiện có:**

```sql
-- Option 1: Giữ nguyên customers hiện tại (individual)
-- Không tạo contact_persons cho customer cũ
-- Chỉ áp dụng cho customer mới

-- Option 2: Migrate data cũ thành contact_persons
INSERT INTO contact_persons (customer_id, name, phone, email, is_primary)
SELECT
    id,
    name,
    phone,
    email,
    TRUE  -- Set as primary
FROM customers
WHERE customer_type = 'individual';

-- Sau đó update customers để clear duplicate info
UPDATE customers SET
    name = company_name,  -- hoặc giữ nguyên nếu là individual
    phone = NULL,  -- chuyển sang contact
    email = NULL;  -- chuyển sang contact
```

**Khuyến nghị:**
Áp dụng **Option 1** - giữ backward compatibility, chỉ áp dụng model mới cho khách hàng được tạo sau khi deploy tính năng.

---

### 7. Testing Requirements

#### 7.1. Unit Tests

- [ ] Test tạo customer với contact persons
- [ ] Test validation phone duplicate
- [ ] Test set/unset primary contact
- [ ] Test trigger ensure single primary
- [ ] Test cascade delete khi xóa customer

#### 7.2. Integration Tests

- [ ] Test flow tạo sales order với contact person
- [ ] Test lưu contact_person_id vào stock_issue
- [ ] Test thêm contact person mới từ sales screen
- [ ] Test hiển thị lịch sử giao dịch theo contact person

#### 7.3. UI Tests

- [ ] Test dropdown contact person selection
- [ ] Test "Thêm người liên hệ mới" modal
- [ ] Test đánh dấu primary contact
- [ ] Test validate form khi thêm contact

---

### 8. Acceptance Criteria

✅ **AC1: Quản lý Contact Persons trong Customer Screen**
- User có thể xem danh sách tất cả contact persons của 1 customer
- User có thể thêm/sửa/xóa contact person
- User có thể đánh dấu 1 contact là primary
- Hệ thống ngăn không cho có > 1 primary contact

✅ **AC2: Sử dụng Contact Person trong Sales Flow**
- Khi tạo phiếu xuất, user chọn được contact person từ dropdown
- User có thể thêm contact person mới ngay tại màn hình sales
- Thông tin contact person được lưu vào stock_issue
- Không ghi đè thông tin customer khi thêm contact mới

✅ **AC3: Backward Compatibility**
- Customer cũ vẫn hoạt động bình thường (không bị break)
- Không ảnh hưởng đến stock issues đã tạo trước đó

✅ **AC4: Data Integrity**
- Không có duplicate phone trong cùng 1 customer
- Luôn có đúng 1 primary contact cho company customers
- Cascade delete contact persons khi xóa customer

---

### 9. Dependencies & Risks

**Dependencies:**
- Không phụ thuộc vào module khác

**Risks:**

| Rủi ro | Mức độ | Giảm thiểu |
|--------|--------|------------|
| Data migration phức tạp với customer hiện có | Medium | Áp dụng Option 1 - chỉ dùng cho customer mới |
| UI phức tạp hơn, ảnh hưởng UX | Low | User testing trước khi deploy |
| Performance issue khi load nhiều contacts | Low | Pagination + indexing |

---

### 10. Timeline Estimate

| Giai đoạn | Công việc | Ước tính |
|-----------|-----------|----------|
| Design | UI/UX mockup, Database design | 2 ngày |
| Backend | API development, migration script | 3 ngày |
| Frontend | Customer screen + Sales screen | 3 ngày |
| Testing | Unit + Integration + UAT | 2 ngày |
| **Total** | | **~10 ngày (2 weeks)** |

---

### 11. Future Enhancements

**Các tính năng mở rộng sau này:**

1. **Contact History Tracking**
   - Xem lịch sử giao dịch theo từng contact person
   - Reports: "Top contacts by revenue"

2. **Contact Roles & Permissions**
   - Phân quyền contact: Người mua / Người nhận hàng / Người thanh toán
   - Multi-role per contact

3. **Contact Communication Log**
   - Ghi lại lịch sử liên hệ (calls, emails, meetings)
   - Integration với CRM tools

4. **Contact Birthday/Anniversary**
   - Nhắc nhở sinh nhật, kỷ niệm
   - Marketing automation

---

### 12. Decision & Next Steps

**Trạng thái:** 🟡 Pending Review

**Người quyết định:**
- [ ] Product Owner approval
- [ ] Tech Lead review
- [ ] UX Designer approval

**Next Steps:**
1. Review & gather feedback từ stakeholders
2. Refine requirements nếu cần
3. Tạo JIRA tickets / User Stories
4. Prioritize vào Sprint backlog

---

**Lịch sử cập nhật:**
- 2026-02-05: Initial draft created

---
---

## 🎯 IMPROVEMENT #2: Validation cho Số điện thoại và Email

**Ngày đề xuất:** 2026-02-05
**Người đề xuất:** QC Team (từ Test Cases review)
**Mức độ ưu tiên:** Medium
**Trạng thái:** Open
**Nguồn gốc:** Chuyển từ [Test Cases - Issues #5, #6](./test-cases-demo.md#-issues-tổng-hợp-ngoài-test-cases)

---

### 1. Tổng Quan

**Mô tả ngắn gọn:**
Bổ sung validation real-time cho các trường Số điện thoại và Email trên toàn hệ thống, đảm bảo dữ liệu đầu vào chính xác và trải nghiệm người dùng nhất quán.

**Vấn đề hiện tại:**
- Các trường SĐT và Email chưa có validation format
- User có thể nhập dữ liệu không hợp lệ (VD: SĐT 5 số, email thiếu @)
- Dữ liệu sai ảnh hưởng đến liên hệ khách hàng, gửi email thông báo BH

**Phạm vi áp dụng:**
- Form tạo/sửa Khách hàng (Customer Management)
- Form thông tin khách trong Phiếu xuất (Sales)
- Form tạo Phiếu dịch vụ (Service Ticket)
- Bất kỳ form nào có trường SĐT hoặc Email

---

### 2. Yêu cầu Chi tiết

#### 2.1. Validation cho Số điện thoại (VN)

**Format:**
- 10-11 số, bắt đầu bằng `0` (VD: 0901234567) hoặc `+84` (VD: +84901234567)
- Regex: `^(0|\+84)[0-9]{9,10}$`
- Error message: "Số điện thoại không hợp lệ. Vui lòng nhập 10-11 số, bắt đầu bằng 0 hoặc +84"

#### 2.2. Validation cho Email

**Format:**
- Chuẩn RFC 5322
- Regex: `^[^\s@]+@[^\s@]+\.[^\s@]+$`
- Error message: "Email không hợp lệ. Vui lòng nhập đúng định dạng (vd: name@domain.com)"

---

### 3. UX Requirements (Áp dụng chung cho cả SĐT và Email)

**Hành vi validation:**
- Real-time validation khi user blur khỏi field (on blur)
- Clear error ngay khi user bắt đầu sửa (on input change)

**Hiển thị lỗi:**
- Error message màu đỏ (#DC2626) ngay dưới ô nhập
- Icon cảnh báo bên cạnh message
- Border ô nhập chuyển màu đỏ khi có lỗi
- Border trở về bình thường khi user bắt đầu sửa

**Mockup:**
```
┌─────────────────────────────────────┐
│ Số điện thoại *                      │
│ ┌─────────────────────────────────┐ │
│ │ 012345                          │ │  ← Border đỏ
│ └─────────────────────────────────┘ │
│ ⚠️ Số điện thoại không hợp lệ.      │  ← Text đỏ #DC2626
│    Vui lòng nhập 10-11 số,          │
│    bắt đầu bằng 0 hoặc +84         │
└─────────────────────────────────────┘

┌─────────────────────────────────────┐
│ Email                                │
│ ┌─────────────────────────────────┐ │
│ │ abc@                            │ │  ← Border đỏ
│ └─────────────────────────────────┘ │
│ ⚠️ Email không hợp lệ.              │  ← Text đỏ #DC2626
│    Vui lòng nhập đúng định dạng     │
│    (vd: name@domain.com)            │
└─────────────────────────────────────┘
```

---

### 4. Technical Implementation

#### 4.1. Shared Validation Utility

```typescript
// utils/validation.ts

export const PHONE_REGEX = /^(0|\+84)[0-9]{9,10}$/;
export const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export const validatePhone = (value: string): string | null => {
  if (!value) return null; // Optional field, no error if empty
  if (!PHONE_REGEX.test(value)) {
    return 'Số điện thoại không hợp lệ. Vui lòng nhập 10-11 số, bắt đầu bằng 0 hoặc +84';
  }
  return null;
};

export const validateEmail = (value: string): string | null => {
  if (!value) return null; // Optional field, no error if empty
  if (!EMAIL_REGEX.test(value)) {
    return 'Email không hợp lệ. Vui lòng nhập đúng định dạng (vd: name@domain.com)';
  }
  return null;
};
```

#### 4.2. Reusable Form Field Component

```typescript
// components/ValidatedInput.tsx
// Tạo component reusable với:
// - onBlur: trigger validation
// - onChange: clear error
// - Error state: red border + error message + warning icon
// - Nhất quán trên toàn hệ thống
```

#### 4.3. Backend Validation (Double-check)

```typescript
// Validation cũng cần ở backend (API layer) để đảm bảo data integrity
// Trả về 422 Unprocessable Entity nếu format không hợp lệ
```

---

### 5. Acceptance Criteria

- [ ] **AC1:** SĐT nhập đúng format (0xxx hoặc +84xxx, 10-11 số) → Không hiển thị lỗi
- [ ] **AC2:** SĐT nhập sai format → Hiển thị error message màu đỏ khi blur
- [ ] **AC3:** Email nhập đúng format → Không hiển thị lỗi
- [ ] **AC4:** Email nhập sai format → Hiển thị error message màu đỏ khi blur
- [ ] **AC5:** Error tự clear khi user bắt đầu sửa (on input change)
- [ ] **AC6:** Validation hoạt động nhất quán trên tất cả form có SĐT/Email
- [ ] **AC7:** Backend cũng reject dữ liệu không hợp lệ (422 response)

---

### 6. Testing Checklist

- [ ] Test SĐT hợp lệ: 0901234567, +84901234567, 02812345678
- [ ] Test SĐT không hợp lệ: 12345, abc, 090123, +8490123456789999
- [ ] Test Email hợp lệ: test@domain.com, a@b.co
- [ ] Test Email không hợp lệ: @domain.com, test@, test@.com, test
- [ ] Test trường rỗng (nếu optional): Không hiển thị lỗi
- [ ] Test trường rỗng (nếu required): Hiển thị "Trường bắt buộc"
- [ ] Test trên tất cả form: Customer, Sales, Service Ticket

---

### 7. Decision & Next Steps

**Trạng thái:** 🟡 Pending Review

**Next Steps:**
1. Review & approve approach
2. Implement shared validation utility
3. Apply to all forms có SĐT/Email
4. Test across all screens

---

**Lịch sử cập nhật:**
- 2026-02-05: Chuyển từ Test Cases Issues #5, #6

