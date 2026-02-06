# Tài Liệu Kỹ Thuật - Service Center App

**Thư mục**: `docs/doc-kien/`
**Mục đích**: Tài liệu kỹ thuật, kế hoạch triển khai và hướng dẫn vận hành

---

## 📚 Danh Mục Tài Liệu

### 🐳 Docker Deployment

#### [deployment/](./deployment/) ⭐ **MAIN DEPLOYMENT DOCS**
**Tài liệu triển khai Docker (3 documents, 42KB)**

**Bao gồm**:
- 📄 **[docker-deployment-plan.md](./deployment/docker-deployment-plan.md)** (22KB)
  - Kế hoạch triển khai chi tiết
  - Phân tích hiện trạng (95% complete)
  - 4 phases triển khai (11-16h total)
  - Production readiness checklist

- 📄 **[docker-quick-reference.md](./deployment/docker-quick-reference.md)** (11KB)
  - Quick start guide (3 commands)
  - Daily operations commands
  - Troubleshooting scenarios
  - Best practices

- 📄 **[docker-deployment-checklist.md](./deployment/docker-deployment-checklist.md)** (8.7KB)
  - Phase-by-phase checklist
  - Progress tracking
  - Timeline summary
  - Sign-off table

**Quick Start**:
```bash
# Read this first
cat docs/doc-kien/deployment/README.md

# Then follow quick reference
cat docs/doc-kien/deployment/docker-quick-reference.md
```

**Dành cho**: All roles - Xem [deployment/README.md](./deployment/README.md) cho chi tiết

---

### 🏗️ Architecture

#### [architecture/](./architecture/)
**Kiến Trúc Hệ Thống**

*Note: Xem các file trong thư mục con*

---

### 🔧 Implementation Plans

#### [implement/](./implement/)
**Kế Hoạch Triển Khai Các Features**

**Files**:
- Implementation plans cho các features cụ thể
- Technical specs
- Migration guides

---

### 🐛 Bug Fixes

#### [fix/](./fix/)
**Tài Liệu Fix Bugs**

**Files**:
- Bug analysis reports
- Fix documentation
- Test cases

---

### 📦 Inventory & Warehouse

#### [inventory-simplification-plan.md](./inventory-simplification-plan.md)
**Kế Hoạch Đơn Giản Hóa Inventory System**

#### [warehouse-location-implementation.md](./warehouse-location-implementation.md)
**Implementation Guide: Warehouse Locations**

#### [warehouse-location-workflow.md](./warehouse-location-workflow.md)
**Workflow: Quản Lý Vị Trí Kho**

---

### 🎫 Ticket Management

#### [DIEU-CHINH-LOGIC-HOAN-THANH-TICKET.md](./DIEU-CHINH-LOGIC-HOAN-THANH-TICKET.md)
**Điều Chỉnh Logic Hoàn Thành Ticket**

#### [plan-default-ticket-outcome.md](./plan-default-ticket-outcome.md)
**Kế Hoạch: Default Ticket Outcome**

---

### 🧪 Testing

#### [test-cases-warranty-workflow.md](./test-cases-warranty-workflow.md)
**Test Cases: Warranty Workflow**

---

## 🎯 Tài Liệu Theo Vai Trò

### Developers 👨‍💻
**Bắt đầu với**:
1. [deployment/docker-quick-reference.md](./deployment/docker-quick-reference.md) - Daily commands
2. [deployment/docker-deployment-plan.md](./deployment/docker-deployment-plan.md) - Chi tiết kỹ thuật
3. Architecture docs trong `architecture/`

**Khi nào cần**:
- Setup local environment → [deployment/](./deployment/) Quick reference
- Deploy production → Deployment plan
- Troubleshooting → Quick reference (troubleshooting section)
- Code changes → Quick reference (update commands)

---

### DevOps / SysAdmin 🔧
**Bắt đầu với**:
1. [deployment/docker-deployment-checklist.md](./deployment/docker-deployment-checklist.md) - Track progress
2. [deployment/docker-deployment-plan.md](./deployment/docker-deployment-plan.md) - Full context
3. [deployment/docker-quick-reference.md](./deployment/docker-quick-reference.md) - Operations

**Khi nào cần**:
- Initial deployment → Checklist + Plan
- Daily operations → Quick reference
- Incident response → Quick reference (troubleshooting)
- Capacity planning → Deployment plan (resource limits)

---

### Tech Lead / Manager 👔
**Bắt đầu với**:
1. [deployment/docker-deployment-checklist.md](./deployment/docker-deployment-checklist.md) - High-level overview
2. [deployment/docker-deployment-plan.md](./deployment/docker-deployment-plan.md) - Timeline & resources
3. Phase summaries trong deployment plan

**Khi nào cần**:
- Project planning → Deployment plan (timeline section)
- Progress tracking → Checklist
- Risk assessment → Deployment plan (missing items section)
- Resource allocation → Deployment plan (resource limits)

---

### QA / Tester 🧪
**Bắt đầu với**:
1. [deployment/docker-quick-reference.md](./deployment/docker-quick-reference.md) - Setup test environment
2. Test case documents
3. [deployment/docker-deployment-checklist.md](./deployment/docker-deployment-checklist.md) - Testing section

**Khi nào cần**:
- Setup test environment → Quick reference (quick start)
- Reset environment → Quick reference (reset scenario)
- Test deployment → Checklist (testing section)

---

## 📖 Cách Sử Dụng Tài Liệu

### Scenario 1: First Time Deployment
```
1. Read: deployment/README.md (overview)
2. Read: deployment/docker-deployment-plan.md (Overview, Current State)
3. Follow: deployment/docker-deployment-checklist.md (Phase 1)
4. Reference: deployment/docker-quick-reference.md (as needed)
5. Complete: Checklist items one by one
```

### Scenario 2: Daily Operations
```
1. Use: deployment/docker-quick-reference.md (primary)
2. Reference: deployment/docker-deployment-plan.md (if deep dive needed)
```

### Scenario 3: Troubleshooting
```
1. Check: deployment/docker-quick-reference.md (Troubleshooting section)
2. Review: docker compose logs (commands in quick reference)
3. Escalate: If not resolved, review deployment plan
```

### Scenario 4: Planning & Estimation
```
1. Review: deployment/docker-deployment-checklist.md (timeline summary)
2. Deep dive: deployment/docker-deployment-plan.md (each phase detail)
3. Track: Update checklist with assignments and dates
```

---

## 🔄 Document Maintenance

### Version Control
- All documents are versioned in git
- Major changes should update version number
- Keep change log in each document

### Review Schedule
- **Monthly**: Quick reference (update commands if changed)
- **Quarterly**: Deployment plan (review status, update estimates)
- **After incidents**: Update troubleshooting sections

### Contributing
- Follow markdown formatting standards
- Include dates and version numbers
- Update table of contents if structure changes
- Cross-reference related documents

---

## 📞 Support

### Questions about Documents
- Open issue with label `documentation`
- Tag relevant team members
- Include document name and section

### Suggesting Improvements
- Submit PR with changes
- Include reason for change
- Update related documents if needed

---

## 📋 Document Status

| Document | Status | Last Updated | Next Review |
|----------|--------|--------------|-------------|
| deployment/ (3 docs) | ✅ Complete | 2026-02-06 | 2026-03-06 |
| └─ docker-deployment-plan.md | ✅ Complete | 2026-02-06 | 2026-03-06 |
| └─ docker-quick-reference.md | ✅ Complete | 2026-02-06 | 2026-03-06 |
| └─ docker-deployment-checklist.md | ✅ Complete | 2026-02-06 | 2026-03-06 |
| inventory-simplification-plan.md | ✅ Complete | - | - |
| warehouse-location-*.md | ✅ Complete | - | - |

---

## 🗺️ Roadmap

### Planned Documents
- [ ] Database migration guide
- [ ] Performance tuning guide
- [ ] Scaling guide (horizontal & vertical)
- [ ] Disaster recovery runbook
- [ ] Security audit checklist
- [ ] Multi-instance deployment guide

### In Progress
- N/A

### Completed
- [x] Docker deployment plan
- [x] Docker quick reference
- [x] Docker deployment checklist

---

**Thư mục được tạo**: 2026-02-06
**Cập nhật lần cuối**: 2026-02-06
**Maintainer**: Tech Team
