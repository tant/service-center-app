# RBAC Implementation Checklist

**Project:** Service Center Management System
**Version:** 2.0 - Team Management Security Update
**Date:** 2025-10-25
**Status:** Implementation Required

---

## 📋 Overview

This checklist guides the implementation of updated RBAC rules based on security audit findings from Playwright E2E tests.

### Key Changes
1. ✅ Add route guard for `/team` page (Admin & Manager only)
2. ✅ Remove user deletion capability (replace with deactivate)
3. ✅ Restrict role changes (Manager can only change Tech ↔ Reception)
4. ✅ Implement password reset permissions
5. ✅ Update UI to reflect new permissions

---

## Phase 1: Route Guards & Middleware

### 1.1 Create Route Guard for /team Page

**File:** `src/app/(auth)/team/page.tsx`

**Tasks:**
- [ ] Add role check at page level
- [ ] Redirect unauthorized users to `/unauthorized` or `/dashboard`
- [ ] Show appropriate error message

**Implementation:**
```typescript
// src/app/(auth)/team/page.tsx
import { createClient } from "@/utils/supabase/server";
import { redirect } from "next/navigation";

export default async function TeamPage() {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("user_id", user.id)
    .single();

  // Only Admin and Manager can access team management
  if (!profile || !['admin', 'manager'].includes(profile.role)) {
    redirect("/unauthorized");
  }

  // ... rest of page implementation
}
```

### 1.2 Create Unauthorized Page

**File:** `src/app/(auth)/unauthorized/page.tsx`

**Tasks:**
- [ ] Create new unauthorized page
- [ ] Add Vietnamese error message
- [ ] Add "Return to Dashboard" button

**Implementation:**
```typescript
// src/app/(auth)/unauthorized/page.tsx
import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function UnauthorizedPage() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen gap-4">
      <h1 className="text-3xl font-bold">Không có quyền truy cập</h1>
      <p className="text-muted-foreground">
        Bạn không có quyền truy cập trang này. Vui lòng liên hệ quản trị viên nếu bạn cần trợ giúp.
      </p>
      <Button asChild>
        <Link href="/dashboard">Quay lại Dashboard</Link>
      </Button>
    </div>
  );
}
```

---

## Phase 2: API Permissions Update

### 2.1 Update Staff API Endpoint

**File:** `src/app/api/staff/route.ts`

**Tasks:**
- [ ] Add role validation for POST (create user)
- [ ] Add role validation for PATCH (update user)
- [ ] Remove DELETE endpoint entirely
- [ ] Implement role change restrictions
- [ ] Implement password reset restrictions

**Implementation Example:**
```typescript
// src/app/api/staff/route.ts

// POST - Create new user
export async function POST(request: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Get current user's role
  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("user_id", user.id)
    .single();

  if (!profile) {
    return NextResponse.json({ error: "Profile not found" }, { status: 404 });
  }

  // Only Admin and Manager can create users
  if (!['admin', 'manager'].includes(profile.role)) {
    return NextResponse.json(
      { error: "Forbidden: Only Admin and Manager can create users" },
      { status: 403 }
    );
  }

  const body = await request.json();
  const { role: newUserRole } = body;

  // Manager can only create Technician and Reception
  if (profile.role === 'manager' && !['technician', 'reception'].includes(newUserRole)) {
    return NextResponse.json(
      { error: "Managers can only create Technician and Reception accounts" },
      { status: 403 }
    );
  }

  // ... rest of create logic
}

// PATCH - Update user
export async function PATCH(request: Request) {
  // ... similar role validation

  const body = await request.json();
  const { user_id: targetUserId, role: newRole } = body;

  // If changing role, validate restrictions
  if (newRole) {
    const { data: targetUser } = await supabaseAdmin
      .from("profiles")
      .select("role")
      .eq("user_id", targetUserId)
      .single();

    if (!targetUser) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const currentRole = targetUser.role;

    // Manager can only change Technician ↔ Reception
    if (profile.role === 'manager') {
      const allowedChanges = [
        { from: 'technician', to: 'reception' },
        { from: 'reception', to: 'technician' }
      ];

      const isAllowed = allowedChanges.some(
        rule => rule.from === currentRole && rule.to === newRole
      );

      if (!isAllowed) {
        return NextResponse.json(
          { error: "Managers can only change roles between Technician and Reception" },
          { status: 403 }
        );
      }
    }
  }

  // ... rest of update logic
}

// DELETE - Remove this endpoint entirely
// export async function DELETE(request: Request) {
//   return NextResponse.json(
//     { error: "Account deletion is not allowed. Use deactivate instead." },
//     { status: 403 }
//   );
// }
```

### 2.2 Create Password Reset API Endpoint

**File:** `src/app/api/staff/reset-password/route.ts` (NEW)

**Tasks:**
- [ ] Create new API endpoint for password reset
- [ ] Validate actor role vs target role
- [ ] Update password in Supabase Auth
- [ ] Log audit trail
- [ ] Send email notification to user

**Implementation:**
```typescript
// src/app/api/staff/reset-password/route.ts
import { createClient } from "@/utils/supabase/server";
import { createClient as createAdminClient } from "@/utils/supabase/admin";
import { NextResponse } from "next/server";

const canResetPassword = (actorRole: string, targetRole: string) => {
  if (actorRole === 'admin') {
    return ['manager', 'technician', 'reception'].includes(targetRole);
  }

  if (actorRole === 'manager') {
    return ['technician', 'reception'].includes(targetRole);
  }

  return false;
};

export async function POST(request: Request) {
  const supabase = await createClient();
  const supabaseAdmin = createAdminClient();

  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Get actor's role
  const { data: actorProfile } = await supabase
    .from("profiles")
    .select("role")
    .eq("user_id", user.id)
    .single();

  if (!actorProfile) {
    return NextResponse.json({ error: "Profile not found" }, { status: 404 });
  }

  const body = await request.json();
  const { user_id: targetUserId, new_password: newPassword } = body;

  // Get target user's role
  const { data: targetProfile } = await supabaseAdmin
    .from("profiles")
    .select("role")
    .eq("user_id", targetUserId)
    .single();

  if (!targetProfile) {
    return NextResponse.json({ error: "Target user not found" }, { status: 404 });
  }

  // Check permission
  if (!canResetPassword(actorProfile.role, targetProfile.role)) {
    return NextResponse.json(
      {
        error: `${actorProfile.role} cannot reset password for ${targetProfile.role}`
      },
      { status: 403 }
    );
  }

  // Reset password using admin client
  const { error } = await supabaseAdmin.auth.admin.updateUserById(
    targetUserId,
    { password: newPassword }
  );

  if (error) {
    return NextResponse.json(
      { error: "Failed to reset password" },
      { status: 500 }
    );
  }

  // Log audit trail
  await supabaseAdmin.from("audit_logs").insert({
    user_id: user.id,
    user_role: actorProfile.role,
    action: "password_reset",
    resource_type: "user",
    resource_id: targetUserId,
    changes: { password_reset: true },
    reason: "Password reset by admin/manager",
    ip_address: request.headers.get("x-forwarded-for") || "unknown"
  });

  return NextResponse.json({ success: true });
}
```

---

## Phase 3: UI Component Updates

### 3.1 Update Team Table Component

**File:** `src/components/team-table.tsx`

**Tasks:**
- [ ] Remove DELETE button/functionality
- [ ] Update role dropdown to show only allowed options for Manager
- [ ] Add password reset button (Admin & Manager only)
- [ ] Update button visibility based on current user role
- [ ] Add confirmation dialogs for sensitive operations

**Changes Needed:**

1. **Remove Delete Functionality:**
```typescript
// REMOVE this from QuickActions component
// const handleDelete = async () => { ... };

// REMOVE delete button from UI
```

2. **Update Role Change Dropdown:**
```typescript
function QuickActions({ member, allMembers, onUpdate }: QuickActionsProps) {
  const { data: currentUser } = useProfile(); // Get current user

  const handleRoleChange = async (newRole: string) => {
    // Existing validation...

    // NEW: Check if Manager trying to change to/from Admin/Manager
    if (currentUser?.role === 'manager') {
      const currentRole = member.role;
      const allowedChanges = [
        { from: 'technician', to: 'reception' },
        { from: 'reception', to: 'technician' }
      ];

      const isAllowed = allowedChanges.some(
        rule => rule.from === currentRole && rule.to === newRole
      );

      if (!isAllowed) {
        toast.error(
          "Managers can only change roles between Technician and Reception"
        );
        return;
      }
    }

    // ... rest of role change logic
  };

  // Update dropdown options based on current user role
  const getAvailableRoles = () => {
    if (currentUser?.role === 'admin') {
      return ["admin", "manager", "technician", "reception"];
    }

    if (currentUser?.role === 'manager') {
      // Manager can only see and change Tech/Reception
      if (['technician', 'reception'].includes(member.role)) {
        return ["technician", "reception"];
      }
      // Don't show dropdown for Admin/Manager roles
      return [];
    }

    return [];
  };

  const availableRoles = getAvailableRoles();

  return (
    <div className="flex items-center gap-1">
      {/* Change Role - only show if roles available */}
      {availableRoles.length > 0 && (
        <DropdownMenu>
          {/* ... role dropdown */}
        </DropdownMenu>
      )}

      {/* NEW: Password Reset Button */}
      {canResetPassword(currentUser?.role, member.role) && (
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="sm"
              className="size-9 p-0 text-muted-foreground hover:text-foreground"
              onClick={handlePasswordReset}
            >
              <IconKey className="size-5" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            <p>Đặt lại mật khẩu</p>
          </TooltipContent>
        </Tooltip>
      )}

      {/* Toggle Active/Inactive - existing functionality */}
      <Tooltip>
        {/* ... existing deactivate/activate button */}
      </Tooltip>

      {/* REMOVED: Delete button */}
    </div>
  );
}

const canResetPassword = (actorRole?: string, targetRole?: string) => {
  if (!actorRole || !targetRole) return false;

  if (actorRole === 'admin') {
    return ['manager', 'technician', 'reception'].includes(targetRole);
  }

  if (actorRole === 'manager') {
    return ['technician', 'reception'].includes(targetRole);
  }

  return false;
};
```

3. **Add Password Reset Modal:**
```typescript
function PasswordResetModal({
  user,
  trigger,
  onSuccess
}: {
  user: Profile;
  trigger: React.ReactNode;
  onSuccess?: () => void;
}) {
  const [open, setOpen] = React.useState(false);
  const [isLoading, setIsLoading] = React.useState(false);
  const [newPassword, setNewPassword] = React.useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (newPassword.length < 6) {
      toast.error("Mật khẩu phải có ít nhất 6 ký tự");
      return;
    }

    setIsLoading(true);

    try {
      const response = await fetch("/api/staff/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          user_id: user.user_id,
          new_password: newPassword
        })
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error);
      }

      toast.success("Đặt lại mật khẩu thành công");
      setOpen(false);
      setNewPassword("");

      if (onSuccess) onSuccess();
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Không thể đặt lại mật khẩu";
      toast.error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Đặt lại mật khẩu</DialogTitle>
          <DialogDescription>
            Đặt mật khẩu mới cho {user.full_name}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="new-password">Mật khẩu mới</Label>
            <Input
              id="new-password"
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder="Nhập mật khẩu mới (tối thiểu 6 ký tự)"
              minLength={6}
              required
            />
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Hủy
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? "Đang xử lý..." : "Đặt lại mật khẩu"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
```

---

## Phase 4: Test Updates

### 4.1 Update E2E Tests

**File:** `e2e-tests/3-rbac-permissions.spec.ts`

**Tasks:**
- [ ] Update Manager test to expect access to /team
- [ ] Update Technician test to expect blocked from /team
- [ ] Update Reception test to expect blocked from /team
- [ ] Add test for role change restrictions
- [ ] Add test for password reset permissions
- [ ] Remove any tests for user deletion

**Test Updates:**
```typescript
// Update Manager test
test("Manager CAN access team management", async ({ page }) => {
  await login(page, testUsers.manager);
  await page.goto("/team");
  await page.waitForLoadState("networkidle");

  // Should NOT show unauthorized
  await expect(
    page.getByText(/unauthorized|không có quyền/i)
  ).not.toBeVisible();

  console.log("✓ Manager can access team management");

  await logout(page);
});

// Keep existing tests for Technician and Reception blocking
// They should still be blocked from /team

// NEW: Test role change restrictions
test("Manager can only change Tech ↔ Reception roles", async ({ page }) => {
  await login(page, testUsers.manager);
  await page.goto("/team");

  // Find a technician in the list
  const techRow = page.locator('tr:has-text("technician")').first();

  // Click role dropdown
  await techRow.getByRole("button", { name: /shield|vai trò/i }).click();

  // Should only see Technician and Reception options
  await expect(page.getByRole("option", { name: "Quản lý" })).not.toBeVisible();
  await expect(page.getByRole("option", { name: "Quản trị viên" })).not.toBeVisible();
  await expect(page.getByRole("option", { name: "Kỹ thuật viên" })).toBeVisible();
  await expect(page.getByRole("option", { name: "Lễ tân" })).toBeVisible();

  await logout(page);
});
```

---

## Phase 5: Documentation Updates

### 5.1 Update CLAUDE.md

**File:** `CLAUDE.md`

**Tasks:**
- [ ] Update RBAC section with new team management rules
- [ ] Add note about /team route guard
- [ ] Document password reset feature

---

## Implementation Order

### Week 1: Backend Security
1. ✅ Update documentation (COMPLETED)
2. ⏳ Create /unauthorized page
3. ⏳ Add route guard to /team page
4. ⏳ Update staff API endpoint
5. ⏳ Create password reset API endpoint
6. ⏳ Test API endpoints manually

### Week 2: Frontend UI
7. ⏳ Update team-table.tsx component
8. ⏳ Remove delete functionality
9. ⏳ Add password reset modal
10. ⏳ Update role dropdown logic
11. ⏳ Test UI manually

### Week 3: Testing & QA
12. ⏳ Update E2E tests
13. ⏳ Run full test suite
14. ⏳ Fix any failing tests
15. ⏳ Manual QA testing
16. ⏳ Update CLAUDE.md

---

## Verification Checklist

### Security Verification
- [ ] Technician cannot access /team page
- [ ] Reception cannot access /team page
- [ ] Manager can access /team page
- [ ] Admin can access /team page
- [ ] Delete user button is removed from UI
- [ ] Delete user API endpoint is removed or blocked
- [ ] Manager can only change Tech ↔ Reception roles
- [ ] Admin can change any role
- [ ] Manager can reset Tech/Reception passwords
- [ ] Manager cannot reset Manager passwords
- [ ] Admin can reset Manager/Tech/Reception passwords
- [ ] All operations are logged in audit_logs

### UI Verification
- [ ] Role dropdown shows correct options based on current user role
- [ ] Password reset button appears only when allowed
- [ ] Deactivate/Activate works correctly
- [ ] Success/error messages are in Vietnamese
- [ ] Loading states work properly
- [ ] Confirmation dialogs appear for sensitive operations

### Test Verification
- [ ] All E2E tests pass
- [ ] No failing tests remain
- [ ] Test coverage includes new features
- [ ] Tests verify security restrictions

---

## Rollback Plan

If issues are discovered:

1. **Immediate:** Revert the route guard to allow all authenticated users
2. **API:** Keep API restrictions in place (security first)
3. **UI:** Show warning messages instead of blocking
4. **Investigation:** Review logs and user feedback
5. **Fix Forward:** Address issues and redeploy

---

## Notes

- All user-facing messages should be in Vietnamese
- Log all sensitive operations to audit_logs table
- Consider sending email notifications for password resets
- Monitor for any accessibility issues with new UI components
- Ensure mobile responsive design works correctly

---

**Last Updated:** 2025-10-25
**Next Review:** After implementation completion
