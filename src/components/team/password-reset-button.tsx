"use client";

import { IconKey } from "@tabler/icons-react";
import * as React from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useStaffApi } from "@/hooks/use-staff-api";
import type { UserRole } from "@/lib/constants/roles";

interface PasswordResetButtonProps {
  userId: string;
  fullName: string;
  email: string;
  role: UserRole;
  currentUserRole: UserRole;
}

export function PasswordResetButton({
  userId,
  fullName,
  email,
  role,
  currentUserRole,
}: PasswordResetButtonProps) {
  const [showDialog, setShowDialog] = React.useState(false);
  const [newPassword, setNewPassword] = React.useState("");
  const [isLoading, setIsLoading] = React.useState(false);
  const { resetPassword } = useStaffApi();

  // Check if current user can reset this member's password
  const canResetPassword = React.useMemo(() => {
    if (currentUserRole === "admin") {
      return ["manager", "technician", "reception"].includes(role);
    }
    if (currentUserRole === "manager") {
      return ["technician", "reception"].includes(role);
    }
    return false;
  }, [currentUserRole, role]);

  const handleOpenDialog = () => {
    if (!canResetPassword) {
      toast.error("Không có quyền đặt lại mật khẩu cho người dùng này");
      return;
    }
    setNewPassword("");
    setShowDialog(true);
  };

  const handleSubmit = async () => {
    if (newPassword.length < 6) {
      toast.error("Mật khẩu phải có ít nhất 6 ký tự");
      return;
    }

    setIsLoading(true);
    try {
      await resetPassword(userId, newPassword, fullName);
      setShowDialog(false);
      setNewPassword("");
    } catch (_error) {
      // Error already handled by useStaffApi
    } finally {
      setIsLoading(false);
    }
  };

  if (!canResetPassword) {
    return null;
  }

  return (
    <>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            variant="ghost"
            size="sm"
            className="size-9 p-0 text-muted-foreground hover:text-foreground"
            onClick={handleOpenDialog}
            aria-label="Đổi mật khẩu"
            data-testid="password-reset-button"
          >
            <IconKey className="size-5" />
          </Button>
        </TooltipTrigger>
        <TooltipContent>
          <p>Đổi mật khẩu</p>
        </TooltipContent>
      </Tooltip>

      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent data-testid="password-reset-dialog">
          <DialogHeader>
            <DialogTitle>Đặt lại mật khẩu</DialogTitle>
            <DialogDescription>
              Đặt lại mật khẩu cho {fullName} ({email})
            </DialogDescription>
          </DialogHeader>
          <div className="flex flex-col gap-4 py-4">
            <div className="flex flex-col gap-2">
              <Label htmlFor="new-password">Mật khẩu mới</Label>
              <Input
                id="new-password"
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Nhập mật khẩu mới (tối thiểu 6 ký tự)"
                minLength={6}
                disabled={isLoading}
                data-testid="new-password-input"
              />
            </div>
          </div>
          <DialogFooter>
            <DialogClose asChild>
              <Button variant="outline" disabled={isLoading}>
                Hủy bỏ
              </Button>
            </DialogClose>
            <Button
              onClick={handleSubmit}
              disabled={isLoading || newPassword.length < 6}
              data-testid="confirm-password-reset"
            >
              {isLoading ? "Đang đặt lại..." : "Đặt lại mật khẩu"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
