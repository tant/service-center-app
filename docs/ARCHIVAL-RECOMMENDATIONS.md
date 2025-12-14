# Architecture Documentation - Archival Recommendations

**Date:** 2025-11-05
**Prepared By:** Winston (Architect)
**Purpose:** Identify obsolete/redundant documentation for archival

---

## Executive Summary

After creating the consolidated **ARCHITECTURE-MASTER.md**, this document recommends archiving **8 files** (~150KB) to reduce documentation clutter while preserving historical reference.

**Recommendation:** Create `/docs/archive/` directory to preserve these files without cluttering active documentation.

---

## Files Recommended for Archival

### Category 1: Duplicate Files (Old Versions) - HIGH PRIORITY

These files are **superseded by numbered shards** and should be archived immediately:

| File | Size | Superseded By | Reason |
|------|------|---------------|--------|
| `coding-standards.md` | 19KB | `08-coding-standards.md` (17KB) | Old version, content merged into shard |
| `source-tree.md` | 21KB | `06-source-tree.md` (28KB) | Old version, newer shard is more comprehensive |
| `tech-stack.md` | 13KB | `02-technology-stack.md` (17KB) | Old version, shard has more diagrams |

**Total:** 53KB

**Action:** Move to `/docs/archive/old-versions/`

**Verification:**
```bash
# Confirm these are duplicates
diff docs/architecture/coding-standards.md docs/architecture/08-coding-standards.md
diff docs/architecture/source-tree.md docs/architecture/06-source-tree.md
diff docs/architecture/tech-stack.md docs/architecture/02-technology-stack.md
```

---

### Category 2: Completed Planning Documents - MEDIUM PRIORITY

These files served their purpose during development but are now **historical artifacts**:

#### 1. `STATUS.md` (6KB)
**Status:** All shards complete (100%)
**Date:** Last updated 2025-10-23
**Content:** Progress tracking for architecture sharding project
**Reason for Archival:**
- ✅ All 10 shards now complete
- No longer updated
- Historical value only (shows completion timeline)

**Recommendation:** Archive as `/docs/archive/completed-projects/architecture-sharding-status.md`

**Keep or Archive?** **ARCHIVE** - Useful for project history but not for ongoing development

---

#### 2. `inventory-implementation-plan.md` (Unknown size, estimated 30-50KB)
**Status:** Implementation plan from January 2025
**Date:** 2025-01-27
**Content:** Detailed 6-week implementation plan for inventory system
- Database migrations (10 files)
- API structure (tRPC routers)
- Frontend components
- Sprint timeline
- Testing strategy

**Reason for Archival:**
- ✅ Implementation complete (inventory system is live)
- Superseded by current implementation state
- Historical value for understanding original design decisions

**Recommendation:** Archive as `/docs/archive/completed-projects/inventory-implementation-plan-2025-01.md`

**Keep or Archive?** **ARCHIVE** - Implementation complete, current system documented elsewhere

---

#### 3. `inventory-ui-ux-design.md` (Unknown size, estimated 20-40KB)
**Status:** UI/UX design document from January 2025
**Date:** 2025-01-27
**Content:** Complete UI/UX design for merged inventory interface
- Page layouts
- Component specifications
- User flows
- Mobile-responsive design

**Reason for Archival:**
- ✅ Implementation complete (inventory UI is live)
- Superseded by current implementation
- Original design may differ from final implementation

**Recommendation:** Archive as `/docs/archive/completed-projects/inventory-ui-ux-design-2025-01.md`

**Keep or Archive?** **ARCHIVE** - Design phase complete, actual UI may differ

---

#### 4. `PHASE-3-SERVICE-TICKET-WORKFLOW-ARCHITECTURE.md` (Unknown size)
**Status:** Phase 3 architecture design from November 2025
**Date:** November 3, 2025 (Week 9 Design Phase)
**Content:** Design document for service ticket workflow system
- Database schema
- Backend design (entity adapters, tRPC endpoints)
- Frontend design (components, pages)
- Integration specs
- Implementation guide

**Reason for Archival:**
- ✅ Phase 3 implementation likely complete
- Superseded by current architecture docs (01-10 shards)
- Phase-specific documentation no longer relevant

**Recommendation:** Archive as `/docs/archive/completed-projects/phase-3-service-ticket-workflow.md`

**Keep or Archive?** **ARCHIVE** - Phase-based planning is obsolete after implementation

---

### Category 3: Old Changelogs - LOW PRIORITY (Optional)

#### 5. `CHANGELOG-WARRANTY-AND-TRIGGERS.md` (Small, <5KB)
**Status:** Changelog from October 2025
**Date:** 2025-10-29
**Content:** Records migration from single `warranty_end_date` to dual warranty fields
- Breaking changes
- Warranty field changes
- Trigger additions

**Reason for Potential Archival:**
- Historical record of past migration
- Current system state documented in schema files
- Informational value only (no active use)

**Recommendation:** **KEEP** or move to `/docs/archive/changelogs/` if you prefer to separate historical logs

**Keep or Archive?** **OPTIONAL** - Has historical value, but migration is complete. Consider keeping for audit trail.

---

### Category 4: Documents to KEEP (Do NOT Archive)

These files are **actively maintained** and should remain in `/docs/architecture/`:

#### Core Architecture (10 Shards) - KEEP ALL
- ✅ `01-introduction.md` - Living document, updated with each architectural change
- ✅ `02-technology-stack.md` - Updated when tech stack changes
- ✅ `03-data-models.md` - Updated with schema changes
- ✅ `04-component-architecture.md` - Core reference
- ✅ `05-api-design.md` - Updated with new routers
- ✅ `06-source-tree.md` - Core reference
- ✅ `07-infrastructure.md` - Core reference
- ✅ `08-coding-standards.md` - Living standards document
- ✅ `09-testing-strategy.md` - Active testing plan
- ✅ `10-security.md` - Critical security reference
- ✅ `11-audit-logging.md` - Core reference

#### Recent Architectural Changes - KEEP ALL
- ✅ `TERMINOLOGY-REFACTORING-TASKS-WORKFLOWS.md` (2025-10-31) - Recent, important history
- ✅ `INVENTORY-WORKFLOW-V2.md` (2025-10-29, updated 2025-11-05) - Current architecture, actively maintained
- ✅ `PHYSICAL-PRODUCTS-SCHEMA-UPDATE.md` (2025-10-31) - Recent breaking change, important reference
- ✅ `DEFAULT-WAREHOUSE-SYSTEM.md` (2025-10-30) - Current system design
- ✅ `SERVICE-REQUEST-DRAFT-AND-PHONE-LOOKUP.md` (2025-11-02) - Recent feature
- ✅ `WARRANTY-MANAGEMENT.md` - Current warranty system
- ✅ `SERIAL-ENTRY-WORKFLOW-ARCHITECTURE.md` - Current serial entry system

#### Frontend Architecture - KEEP
- ✅ `frontend-architecture-current.md` - Production state reference
- ✅ `frontend-architecture-roadmap.md` - Future planning

#### Schema Reference - KEEP
- ✅ `inventory-management-schema.md` - Detailed schema documentation

#### Navigation - KEEP
- ✅ `README.md` - Documentation navigation guide

---

## Proposed Archive Directory Structure

Create the following structure to preserve archived files:

```
docs/
├── archive/                                    # NEW
│   ├── README.md                              # Archive index with file descriptions
│   ├── old-versions/                          # Superseded by newer versions
│   │   ├── coding-standards-old.md
│   │   ├── source-tree-old.md
│   │   └── tech-stack-old.md
│   ├── completed-projects/                    # Completed planning/design docs
│   │   ├── architecture-sharding-status.md    # STATUS.md
│   │   ├── inventory-implementation-plan-2025-01.md
│   │   ├── inventory-ui-ux-design-2025-01.md
│   │   └── phase-3-service-ticket-workflow.md
│   └── changelogs/                            # Optional: old changelogs
│       └── warranty-and-triggers-2025-10.md   # CHANGELOG-WARRANTY-AND-TRIGGERS.md
└── architecture/                              # Keep current docs here
    ├── ARCHITECTURE-MASTER.md                 # NEW - consolidated overview
    ├── 01-introduction.md ... 11-audit-logging.md  # Core shards
    ├── INVENTORY-WORKFLOW-V2.md ... etc       # Recent changes
    └── README.md                              # Navigation
```

---

## Archival Actions

### Phase 1: Create Archive Structure (5 minutes)

```bash
# Create archive directories
mkdir -p docs/archive/old-versions
mkdir -p docs/archive/completed-projects
mkdir -p docs/archive/changelogs

# Create archive README
cat > docs/archive/README.md << 'EOF'
# Architecture Documentation Archive

This directory contains **archived documentation** that is no longer actively maintained but preserved for historical reference.

## Categories

### Old Versions (`old-versions/`)
Superseded documentation replaced by numbered architecture shards (01-11).

### Completed Projects (`completed-projects/`)
Planning and design documents for completed implementations.

### Changelogs (`changelogs/`)
Historical changelogs for past migrations and schema changes.

## When to Archive

Archive documents when:
1. Superseded by newer versions
2. Implementation/project is complete
3. Content is purely historical (no active use)

## When NOT to Archive

Keep documents when:
1. Actively maintained (e.g., core shards 01-11)
2. Recent architectural changes (< 6 months)
3. Current system design (e.g., INVENTORY-WORKFLOW-V2.md)
4. Future planning (e.g., frontend-architecture-roadmap.md)

---

**Last Updated:** 2025-11-05
EOF
```

### Phase 2: Move Duplicate Files (HIGH PRIORITY)

```bash
# Move old versions to archive
cd docs/architecture

# IMPORTANT: Verify these are actually duplicates first!
git mv coding-standards.md ../archive/old-versions/coding-standards-old.md
git mv source-tree.md ../archive/old-versions/source-tree-old.md
git mv tech-stack.md ../archive/old-versions/tech-stack-old.md

# Commit
git commit -m "Archive superseded architecture docs (old versions of 02, 06, 08)"
```

### Phase 3: Move Completed Planning Docs (MEDIUM PRIORITY)

```bash
cd docs/architecture

# Archive completed project docs
git mv STATUS.md ../archive/completed-projects/architecture-sharding-status.md
git mv inventory-implementation-plan.md ../archive/completed-projects/inventory-implementation-plan-2025-01.md
git mv inventory-ui-ux-design.md ../archive/completed-projects/inventory-ui-ux-design-2025-01.md
git mv PHASE-3-SERVICE-TICKET-WORKFLOW-ARCHITECTURE.md ../archive/completed-projects/phase-3-service-ticket-workflow.md

# Commit
git commit -m "Archive completed planning/design documents"
```

### Phase 4: (Optional) Move Old Changelogs

```bash
cd docs/architecture

# Optional: Move old changelog if desired
git mv CHANGELOG-WARRANTY-AND-TRIGGERS.md ../archive/changelogs/warranty-and-triggers-2025-10.md

# Commit
git commit -m "Archive old changelog for warranty schema migration"
```

---

## Verification Checklist

After archival, verify:

- [ ] All numbered shards (01-11) remain in `/docs/architecture/`
- [ ] All recent change docs remain in `/docs/architecture/`
- [ ] `ARCHITECTURE-MASTER.md` is in `/docs/`
- [ ] No broken links in active documentation
- [ ] Archive README.md created and informative
- [ ] Git history preserved (using `git mv`, not `rm` + `add`)

---

## Impact Assessment

### Before Archival
```
docs/architecture/
├── 29 markdown files
├── ~350KB total size
├── Mix of current + old versions
```

### After Archival
```
docs/architecture/
├── 21 markdown files (-8 files)
├── ~200KB total size (-150KB)
├── All current documentation

docs/archive/
├── 8 markdown files (historical)
├── ~150KB total size
├── Preserved for reference
```

**Benefits:**
- ✅ Cleaner documentation directory
- ✅ Easier navigation for developers
- ✅ Historical artifacts preserved
- ✅ No information loss

**Risks:**
- ⚠️ Ensure no active links point to archived files
- ⚠️ Update any references in CLAUDE.md or other docs

---

## Maintenance Guidelines

### When to Archive in the Future

**Archive when:**
1. Document is superseded by newer version
2. Implementation project is complete (and > 3 months old)
3. Content is purely historical with no active use
4. Phase-specific planning no longer relevant

**Keep when:**
1. Document is actively maintained
2. Represents current system architecture
3. Recent changes (< 6 months)
4. Future planning/roadmap documents

### Archive Naming Convention

```
{original-name}-{date}.md

Examples:
- inventory-implementation-plan-2025-01.md
- phase-3-service-ticket-workflow-2025-11.md
- warranty-and-triggers-changelog-2025-10.md
```

---

## Recommended Next Steps

1. **Immediate (Today):**
   - Create archive directory structure
   - Move duplicate files (`coding-standards.md`, `source-tree.md`, `tech-stack.md`)
   - Verify no broken links

2. **This Week:**
   - Move completed planning docs (`STATUS.md`, implementation plans, design docs)
   - Update any references in `README.md` or navigation docs

3. **Optional (As Needed):**
   - Move old changelogs to archive
   - Periodically review `/docs/architecture/` for more archival candidates

4. **Follow-up:**
   - Update `docs/architecture/README.md` to mention archive directory
   - Add link to `ARCHITECTURE-MASTER.md` in main README

---

## Approval

**Status:** Pending Review

**Reviewed By:** _______________________

**Approved By:** _______________________

**Date:** _______________________

---

**Document Version:** 1.0
**Last Updated:** 2025-11-05
**Next Review:** After archival execution

---

**End of Archival Recommendations**
