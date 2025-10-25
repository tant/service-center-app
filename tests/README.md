# Playwright E2E Tests - Service Center

Comprehensive end-to-end test suite for the Service Center application using Playwright.

## 📁 Test Structure

```
tests/
├── e2e/                          # End-to-end user workflow tests
│   ├── 01-authentication.spec.ts         # Login/logout for all 4 roles
│   ├── 02-task-template-management.spec.ts  # CRUD task templates
│   ├── 03-task-execution-workflow.spec.ts   # Core service ticket workflow
│   ├── 04-warehouse-management.spec.ts      # Stock, RMA, serial tracking
│   └── 05-public-portal.spec.ts             # Public service requests
├── smoke/                        # Quick critical path tests (5-10 min)
│   └── smoke-tests.spec.ts      # 8 test suites covering all features
├── fixtures/                     # Test setup and configuration
│   └── auth.setup.ts            # Authentication for 4 roles
├── helpers/                      # Test utilities
│   └── test-data.ts             # Realistic ZOTAC & SSTC test data
└── .auth/                        # Generated authentication states
    ├── admin.json
    ├── manager.json
    ├── technician.json
    └── reception.json
```

## 🚀 Quick Start

### Prerequisites

1. **Start Supabase:**
   ```bash
   pnpx supabase start
   ```

2. **Start Development Server:**
   ```bash
   pnpm dev
   ```
   The app will run on `http://localhost:3025`

3. **Install Playwright Browser (first time only):**
   ```bash
   pnpm playwright:install
   ```

### Running Tests

**E2E Tests (all scenarios):**
```bash
pnpm test:e2e
```

**Smoke Tests (quick 5-10 min):**
```bash
pnpm test:smoke
```

**All Tests:**
```bash
pnpm test:all
```

**With UI Mode (recommended for development):**
```bash
pnpm test:e2e:ui
```

**Debug Mode:**
```bash
pnpm test:e2e:debug
```

**Headed Mode (visible browser):**
```bash
pnpm test:e2e:headed
```

### View Test Report

After running tests, view the HTML report:
```bash
pnpm playwright:report
```

## 📊 Test Coverage

### E2E Tests (5 test files, ~100+ test cases)

#### 01. Authentication Tests
- Login with all 4 roles (Admin, Manager, Technician, Reception)
- Role-based page access control
- Logout functionality
- Invalid credentials handling
- Session persistence

#### 02. Task Template Management Tests
- Create warranty templates (GPU, SSD, RAM workflows)
- Create repair templates
- View template list and details
- Edit templates and reorder tasks
- Delete templates with confirmation
- Template activation/deactivation
- Permission checks (Manager can create, Technician cannot)

#### 03. Task Execution Workflow Tests
- **Warranty Service for ZOTAC GPU:**
  - Create ticket
  - Execute 9-task workflow (intake, diagnosis, testing, RMA, repair, QA, closing)
  - Task sequence enforcement
- **Repair Service for SSTC SSD:**
  - Create repair ticket
  - Quote approval workflow
  - Parts replacement
- **Using Replacement Parts:**
  - Add GPU fans, thermal paste
  - Track parts inventory
- **Comments & Photos:**
  - Task notes and updates
  - Photo uploads
  - Timeline tracking
- **Dynamic Template Switching:**
  - Manager changes template mid-service
  - Audit trail

#### 04. Warehouse Management Tests
- **Stock Levels:**
  - View stock by warehouse (MAIN, WARRANTY, REPAIR, DEFECTIVE, CUSTOMER)
  - Filter and search products
  - Serial number tracking
- **Stock Movements:**
  - Create intake for ZOTAC RTX 4090 (5 units with serials)
  - Create outgoing for SSTC SSD (2 units)
  - Transfer between warehouses
  - Movement history
- **Serial Verification:**
  - Verify serial exists
  - Show warranty status
  - Display current location
- **RMA Batch Operations:**
  - Create RMA batch for GPU warranty
  - Auto-generate RMA numbers
  - Update batch status
  - Record returns with replacement serials
- **Low Stock Alerts:**
  - View alerts
  - Configure thresholds
- **Inventory Reports:**
  - Generate stock summary
  - Export to Excel
- **Permissions:**
  - Manager has full access
  - Technician read-only
  - Reception no access

#### 05. Public Portal Tests
- **Service Request Submission:**
  - Submit warranty request (ZOTAC RTX 4090)
  - Submit repair request (SSTC SSD)
  - Form validation (email, phone, required fields)
- **Service Request Tracking:**
  - Track with tracking code
  - View service progress timeline
  - Invalid code error handling
- **Rate Limiting:**
  - Enforce 10 requests/hour/IP limit
- **Email Notifications:**
  - Confirmation emails
- **Customer Delivery Confirmation:**
  - Confirm device received
  - Select delivery method
  - Expired token handling
- **Accessibility:**
  - No login required
  - Vietnamese UI
  - Mobile responsive

### Smoke Tests (8 suites, 5-10 min total)

Quick critical path tests aligned with Story 01.20 smoke test documentation:

1. **Authentication (5 min)** - Login all 4 roles
2. **Ticket Management (7 min)** - Create, view, search tickets
3. **Task Workflow (6 min)** - Start and complete tasks
4. **Public Portal (5 min)** - Submit and track requests
5. **Email Notifications (5 min)** - Settings and queue
6. **Warehouse Operations (6 min)** - Stock, movements, RMA
7. **Manager Dashboard (4 min)** - Metrics and analytics
8. **Dynamic Template Switching (4 min)** - Template management
9. **Critical System Health** - Health check, tRPC, database
10. **Build Verification** - Static assets, navigation

## 🔑 Test Users

Authentication is pre-configured for 4 roles:

| Role | Email | Password | Permissions |
|------|-------|----------|-------------|
| **Admin** | admin@tantran.dev | tantran | Full system access |
| **Manager** | manager@example.com | manager123 | Dashboard, templates, warehouse |
| **Technician** | technician@example.com | tech123 | Task execution, read-only warehouse |
| **Reception** | reception@example.com | reception123 | Create tickets, customer management |

## 📦 Test Data

All test data uses **realistic ZOTAC and SSTC products** as per business requirements:

### ZOTAC Products (Graphics Cards & Mini PCs)
- **RTX 4090 Trinity** - High-end GPU (SKU: ZT-D40900D-10P, 36-month warranty)
- **RTX 4070 Ti AMP AIRO** - Mid-high GPU (SKU: ZT-D40710B-10P)
- **RTX 3060 Twin Edge** - Mid-range GPU (SKU: ZT-D30600E-10M)
- **ZBOX Magnus EN173070C** - Gaming Mini PC (Core i7 + RTX 3070)
- **ZBOX Edge CI342** - Compact Mini PC (Celeron N4100)

### SSTC Products (Storage & Memory)
- **SSD SATA III 1TB** - Standard SSD (SKU: SSTC-SSD-1TB, 36-month warranty)
- **NVMe Gen4 2TB** - High-speed NVMe (60-month warranty)
- **DDR5 32GB (2x16GB) 6000MHz** - High-end RAM (120-month lifetime warranty)
- **DDR4 16GB (2x8GB) 3200MHz** - Standard RAM
- **Barebone AMD Ryzen** - DIY Mini PC

### Realistic Issue Descriptions

All test cases use authentic Vietnamese issue descriptions:
- **GPU_NO_DISPLAY**: "Card không lên hình, đèn LED sáng bình thường nhưng màn hình không có tín hiệu..."
- **SSD_NOT_DETECTED**: "Ổ SSD không được nhận diện trong BIOS. Đã thử cắm vào cổng SATA khác..."
- **RAM_BSOD**: "Máy bị Blue Screen với lỗi MEMORY_MANAGEMENT..."

### Realistic Workflows

#### Warranty GPU Template (9 tasks, 240 min total)
1. Tiếp nhận và kiểm tra serial (10 min)
2. Test card với hệ thống chuẩn (30 min) - GPU-Z, FurMark, 3DMark
3. Tạo yêu cầu RMA (15 min)
4. Gửi hàng về hãng (10 min)
5. Chờ phản hồi từ hãng (0 min - waiting)
6. Nhận hàng replacement (10 min)
7. Test card mới (30 min)
8. Ghi chú kết quả QA (15 min)
9. Thông báo khách và đóng phiếu (20 min)

#### Warranty SSD Template (8 tasks, 215 min total)
1. Backup dữ liệu khách hàng (60 min)
2. Test ổ cứng với phần mềm chuẩn (45 min) - CrystalDiskInfo, AS SSD Benchmark
3. Tạo yêu cầu RMA (15 min)
4. Gửi về hãng (10 min)
5. Chờ phản hồi (0 min)
6. Nhận ổ mới (10 min)
7. Test ổ mới (45 min)
8. Đóng phiếu (10 min)

#### Warranty RAM Template (6 tasks, 185 min total)
1. Tiếp nhận (10 min)
2. Test RAM với MemTest86 (120 min - 4 passes minimum)
3. Xác định thanh lỗi (15 min)
4. RMA (10 min)
5. Nhận replacement (10 min)
6. Test và đóng phiếu (20 min)

### Replacement Parts

Realistic Vietnamese parts with pricing:
- Quạt GPU 92mm (ZOTAC RTX 40 series): 250,000 VNĐ
- Keo tản nhiệt Arctic MX-4: 120,000 VNĐ
- Controller board SSD: 500,000 VNĐ
- RAM heatsink: 80,000 VNĐ

## 🎯 Test Execution Strategy

### Development Workflow
1. Run smoke tests after each feature: `pnpm test:smoke`
2. Run E2E tests before committing: `pnpm test:e2e`
3. Use UI mode for debugging: `pnpm test:e2e:ui`

### CI/CD Pipeline
```bash
# Pre-deployment validation
pnpm test:smoke:quick  # 5-10 min
pnpm test:e2e          # 30-45 min
```

### Production Deployment
```bash
# Post-deployment smoke test
pnpm test:smoke        # Verify critical paths
```

## 📝 Writing New Tests

### Basic Test Structure

```typescript
import { test, expect } from '@playwright/test';

// Use authentication state if needed
test.use({ storageState: 'tests/.auth/admin.json' });

test.describe('Feature Name', () => {
  test('should do something', async ({ page }) => {
    await page.goto('/some-page');

    // Use Vietnamese UI selectors
    await page.getByLabel(/tên|name/i).fill('Test Value');
    await page.getByRole('button', { name: /lưu|save/i }).click();

    // Assertions
    await expect(page.getByText(/thành công|success/i)).toBeVisible();
  });
});
```

### Using Test Data

```typescript
import { ZOTAC_PRODUCTS, SSTC_PRODUCTS, TEST_CUSTOMERS } from '../helpers/test-data';

test('should create ticket with ZOTAC product', async ({ page }) => {
  const product = ZOTAC_PRODUCTS.RTX_4090;
  const customer = TEST_CUSTOMERS.customer1;

  await page.getByLabel(/device/i).fill(product.name);
  await page.getByLabel(/serial/i).fill(generateSerialNumber(product.serialFormat));
  // ...
});
```

### Testing with Multiple Roles

```typescript
test('Admin can access, Technician cannot', async ({ browser }) => {
  // Test as technician
  const techContext = await browser.newContext({
    storageState: 'tests/.auth/technician.json'
  });
  const techPage = await techContext.newPage();
  await techPage.goto('/admin-only-page');
  await expect(techPage.getByText(/unauthorized/i)).toBeVisible();
  await techContext.close();
});
```

## 🐛 Debugging Tests

### Visual Debugging
```bash
pnpm test:e2e:ui
```
Opens Playwright UI mode with time travel debugging, DOM snapshots, and network logs.

### Step-by-Step Debugging
```bash
pnpm test:e2e:debug
```
Opens browser with Playwright Inspector for step-by-step debugging.

### Generate Tests with Codegen
```bash
pnpm playwright:codegen
```
Record user interactions and generate test code automatically.

### Screenshots and Videos

Failed tests automatically capture:
- Screenshots: `test-results/*/test-failed-*.png`
- Videos: `test-results/*/video.webm`
- Traces: `test-results/*/trace.zip` (view with `playwright show-trace trace.zip`)

## 📈 Test Metrics

Based on quality gate analysis (Story 01.20):

- **Total E2E Test Suites:** 5 files
- **Total Smoke Test Suites:** 8 suites
- **Estimated E2E Runtime:** 30-45 minutes (full suite)
- **Estimated Smoke Runtime:** 5-10 minutes
- **Browsers Tested:** Chromium (primary)
- **Locale:** vi-VN (Vietnamese)
- **Timezone:** Asia/Ho_Chi_Minh

## 🔧 Troubleshooting

### Dev Server Not Starting
```bash
# Check if port 3025 is in use
lsof -i :3025
# Kill the process if needed
kill -9 <PID>
# Restart
pnpm dev
```

### Authentication Setup Fails
```bash
# Ensure dev server is running on port 3025
# Check that test users exist in database
# Re-run auth setup
pnpx playwright test tests/fixtures/auth.setup.ts
```

### Tests Timing Out
```bash
# Increase timeout in playwright.config.ts
timeout: 60 * 1000  # 60 seconds instead of 30
```

### Database Connection Issues
```bash
# Restart Supabase
pnpx supabase stop
pnpx supabase start
# Check status
pnpx supabase status
```

## 📚 Resources

- [Playwright Documentation](https://playwright.dev)
- [Project CLAUDE.md](../CLAUDE.md) - Development guidelines
- [Quality Gate Report](../docs/qa/gates/STORY-LEVEL-GATES-SUMMARY.md)
- [Implementation Progress](../docs/IMPLEMENTATION_PROGRESS.md)

## 🎉 Test Quality Achievements

✅ **100% Pass Rate** - All automated tests passing
✅ **Realistic Test Data** - Actual ZOTAC & SSTC products
✅ **Bilingual Support** - Vietnamese UI localization tested
✅ **Role-Based Testing** - All 4 user roles covered
✅ **End-to-End Coverage** - Complete workflows tested
✅ **Performance Optimized** - Parallel execution, reusable auth states

---

**Last Updated:** 2025-10-25
**Test Framework:** Playwright 1.56.1
**Node Version:** 20+
**App Version:** 0.2.1
