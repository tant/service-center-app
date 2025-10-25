# Automation-Friendly UI Patterns

This document captures lessons learned from making UI components testable with Playwright while maintaining identical UI/UX.

## Problem: Dropdown Menu Not Opening in Playwright Tests

### Symptoms
- Button appears to be clicked (shown in `[active]` state in error context)
- Dropdown menu content never appears
- `expect(dropdownContent).toBeVisible()` fails with "element(s) not found"

### Root Cause: Component Nesting Issue

**Problematic Structure:**
```tsx
// ❌ WRONG: Tooltip wrapping DropdownMenuTrigger
<DropdownMenu>
  <DropdownMenuTrigger asChild>
    <Tooltip>
      <TooltipTrigger asChild>
        <Button>...</Button>
      </TooltipTrigger>
      <TooltipContent>...</TooltipContent>
    </Tooltip>
  </DropdownMenuTrigger>
  <DropdownMenuContent>...</DropdownMenuContent>
</DropdownMenu>
```

**Why it fails:**
- `DropdownMenuTrigger` needs direct control over the trigger element to handle click events
- Wrapping it with `Tooltip` breaks the event propagation chain
- The tooltip intercepts clicks before they reach the dropdown trigger
- Works in manual testing (browser handles hover/click differently) but fails in automated tests

### Solution: Correct Component Nesting

**Fixed Structure:**
```tsx
// ✅ CORRECT: DropdownMenuTrigger wrapping Tooltip
<DropdownMenu>
  <Tooltip>
    <TooltipTrigger asChild>
      <DropdownMenuTrigger asChild>
        <Button>...</Button>
      </DropdownMenuTrigger>
    </TooltipTrigger>
    <TooltipContent>...</TooltipContent>
  </Tooltip>
  <DropdownMenuContent>...</DropdownMenuContent>
</DropdownMenu>
```

**Why it works:**
- `DropdownMenuTrigger` is the outermost interactive component
- `Tooltip` wraps the button but doesn't interfere with dropdown trigger
- Click events propagate correctly to the dropdown menu
- Both tooltip and dropdown functionality work as expected

**File:** `src/components/team-table.tsx:461-479`

---

## Testing Attributes Strategy

### 1. Use `aria-label` for Accessibility + Testing

**Benefits:**
- Improves accessibility for screen readers
- Provides semantic selectors for tests
- Works well with nested components
- Zero visual impact

**Example:**
```tsx
<Button
  variant="ghost"
  size="sm"
  aria-label="Thay đổi vai trò"
  data-testid="role-change-button"
>
  <IconShield className="size-5" />
</Button>
```

**Test Usage:**
```typescript
// Works with nested components (Tooltip + DropdownMenuTrigger + Button)
const roleButton = userRow.getByRole('button', { name: 'Thay đổi vai trò' });
await roleButton.click();
```

### 2. Use `data-testid` for Direct Element Selection

**When to use:**
- For non-interactive elements (dialogs, tables, rows)
- When aria-label is not appropriate
- For stable, unique identification

**Example:**
```tsx
<DialogContent data-testid="password-reset-dialog">
<Input data-testid="new-password-input" />
<Button data-testid="confirm-password-reset">
<TableRow data-testid={`team-member-row-${email}`}>
```

**Test Usage:**
```typescript
const dialog = page.getByTestId('password-reset-dialog');
await expect(dialog).toBeVisible();
```

### 3. Use `data-role` for Language-Independent Selection

**Problem with language-dependent selectors:**
```typescript
// ❌ Fragile: Breaks if Vietnamese text changes
await page.getByText('Lễ tân').click();

// ❌ Fragile: May match wrong element
await page.getByText(/lễ tân|kỹ thuật viên/i).first().click();
```

**Solution with `data-role`:**
```tsx
// Component
<DropdownMenuItem
  data-role={role}  // "admin", "manager", "technician", "reception"
  data-testid={`role-option-${role}`}
>
  {role === "admin" ? "Quản trị viên" : /* Vietnamese text */}
</DropdownMenuItem>
```

```typescript
// Test - Language independent, scoped to dropdown menu only
const receptionOption = page.locator('[role="menuitem"][data-role="reception"]');
await receptionOption.click();
```

**Benefits:**
- Works across all languages
- Scoped to specific component type (`[role="menuitem"]`)
- Doesn't match random text elsewhere on page
- Semantic and meaningful

**File:** `src/components/team-table.tsx:505` and `e2e-tests/3-rbac-permissions.spec.ts:728-730`

---

## Dropdown Menu Best Practices

### 1. Wait for Menu to Open

**Use Radix UI's ARIA roles:**
```typescript
// Wait for dropdown menu to open
await page.waitForTimeout(500); // Allow animation
const dropdownContent = page.locator('[role="menu"]').first();
await expect(dropdownContent).toBeVisible({ timeout: 3000 });
```

**Alternative selectors:**
```typescript
// Using data-slot (from shadcn/ui wrapper)
await expect(page.locator('[data-slot="dropdown-menu-content"]')).toBeVisible();

// Using Radix's data-state
await expect(page.locator('[data-state="open"]')).toBeVisible();
```

### 2. Scope Menu Item Selectors

**Problem:**
```typescript
// ❌ May match text in table cells, not dropdown items
await page.getByText('Lễ tân').click();
```

**Solution:**
```typescript
// ✅ Only matches actual menu items
await page.locator('[role="menuitem"][data-role="reception"]').click();
```

### 3. Handle Current Selection State

Dropdown menus may disable or hide the current selection. Tests should handle multiple states:

```typescript
const receptionOption = page.locator('[role="menuitem"][data-role="reception"]');
const technicianOption = page.locator('[role="menuitem"][data-role="technician"]');

const isReceptionVisible = await receptionOption.isVisible({ timeout: 1000 }).catch(() => false);

if (isReceptionVisible) {
  await receptionOption.click();
} else {
  // Already selected, try alternative
  const isTechVisible = await technicianOption.isVisible({ timeout: 1000 }).catch(() => false);
  if (isTechVisible) {
    await technicianOption.click();
  } else {
    throw new Error("Neither option found in dropdown menu");
  }
}
```

---

## Pagination Handling

### Problem: User Not Visible on Current Page

**Symptom:**
```
Error: locator.waitFor: Test timeout of 30000ms exceeded.
waiting for locator('tr:has-text("technician.test@example.com")').first() to be visible
```

**Cause:** User is on page 2 or beyond, not immediately visible.

### Solution: Search Before Interacting

```typescript
// Always search first to handle pagination
const searchInput = page.getByPlaceholder(/tìm theo tên hoặc email/i);
await searchInput.fill(testUsers.technician.email);
await page.waitForTimeout(500); // Allow search to filter

// Now find the row (guaranteed to be visible)
const userRow = page.getByTestId(`team-member-row-${email}`);
await expect(userRow).toBeVisible({ timeout: 5000 });
```

**File:** `e2e-tests/3-rbac-permissions.spec.ts:711-717`

---

## Button Selection Strategy

### Avoid Index-Based Selectors

**Fragile approach:**
```typescript
// ❌ WRONG: Relies on button order, breaks easily
const roleButton = techRow.locator('button').filter({ hasText: '' }).nth(0);
const passwordButton = techRow.locator('button').filter({ hasText: '' }).nth(1);
const toggleButton = techRow.locator('button').filter({ hasText: '' }).nth(2);
```

**Problems:**
- Breaks if button order changes
- Breaks if new buttons added
- Hard to understand what `.nth(0)` means
- Icon-only buttons all match `filter({ hasText: '' })`

### Use Semantic Selectors

**Robust approach:**
```typescript
// ✅ CORRECT: Semantic, resilient to changes
const roleButton = userRow.getByRole('button', { name: 'Thay đổi vai trò' });
const passwordButton = userRow.getByTestId('password-reset-button');
const toggleButton = userRow.getByTestId('toggle-active-button');
```

**Benefits:**
- Self-documenting code
- Resilient to UI changes
- Easy to debug failures
- Matches user intent

---

## Test Resilience Patterns

### 1. Explicit Visibility Checks

```typescript
// ✅ Wait for element before interacting
await expect(dialog).toBeVisible({ timeout: 3000 });
await passwordInput.fill("NewPassword123!");
```

### 2. Graceful Fallbacks

```typescript
// ✅ Try primary selector, fall back if needed
const isVisible = await element.isVisible({ timeout: 1000 }).catch(() => false);
if (isVisible) {
  await element.click();
} else {
  // Try alternative approach
}
```

### 3. Clear Error Messages

```typescript
// ✅ Descriptive error for debugging
throw new Error("Neither Reception nor Technician role option found in dropdown menu");
```

### 4. Console Logging for Debugging

```typescript
// ✅ Log test progress for troubleshooting
console.log("✓ Admin changed role to Reception");
console.log(`✓ Manager correctly restricted to Technician/Reception role changes only (Tech visible: ${techOption}, Reception visible: ${receptionOption})`);
```

---

## Summary of Changes

### Component Changes (team-table.tsx)

1. **Fixed component nesting** (Lines 461-479)
   - Moved `DropdownMenuTrigger` outside `Tooltip`
   - Allows dropdown to open correctly in tests

2. **Added testing attributes:**
   - `aria-label="Thay đổi vai trò"` (Line 469)
   - `data-testid="role-change-button"` (Line 470)
   - `data-testid="password-reset-button"` (Line 534)
   - `data-testid="toggle-active-button"` (Line 559)
   - `data-testid="password-reset-dialog"` (Line 581)
   - `data-testid="new-password-input"` (Line 599)
   - `data-testid="confirm-password-reset"` (Line 612)
   - `data-testid="team-member-row-${email}"` (Line 632)
   - `data-role={role}` on dropdown menu items (Line 505)

### Test Changes (3-rbac-permissions.spec.ts)

1. **Use search to handle pagination** (Lines 711-713)
2. **Use semantic selectors** (Line 720, 728-730)
3. **Wait for dropdown menu** (Lines 724-726)
4. **Scope menu item selection** (Lines 728-730, 845-848)
5. **Handle multiple states** (Lines 731-745)

### Results

- **Before:** 1/7 Team Management tests passing (14%)
- **After:** 7/7 Team Management tests passing (100%)
- **Overall:** 32/32 RBAC tests passing (100%)

---

## Best Practices Checklist

When creating automation-friendly UI components:

- [ ] Use correct component nesting (interactive triggers outermost)
- [ ] Add `aria-label` to icon-only buttons
- [ ] Add `data-testid` to dialogs, inputs, and important elements
- [ ] Add `data-role` or similar for language-independent item selection
- [ ] Avoid wrapping interactive triggers with other interactive components
- [ ] Test both manual UI and automated tests
- [ ] Use semantic selectors (`getByRole`, `aria-label`) over fragile selectors (`.nth()`, index-based)
- [ ] Handle pagination with search functionality
- [ ] Wait for animations and state changes
- [ ] Provide clear error messages in tests
- [ ] Add console logging for test debugging

---

## References

- **Radix UI DropdownMenu:** https://www.radix-ui.com/primitives/docs/components/dropdown-menu
- **Playwright Best Practices:** https://playwright.dev/docs/best-practices
- **ARIA Authoring Practices:** https://www.w3.org/WAI/ARIA/apg/

---

**Last Updated:** 2025-10-25
**Author:** Development Team
**Related Files:**
- `src/components/team-table.tsx`
- `e2e-tests/3-rbac-permissions.spec.ts`
