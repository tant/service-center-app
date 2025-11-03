"use client";

import { IconShield } from "@tabler/icons-react";
import * as React from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useStaffApi } from "@/hooks/use-staff-api";
import { getRoleLabel, type UserRole } from "@/lib/constants/roles";

interface RoleChangeButtonProps {
  userId: string;
  currentRole: UserRole;
  currentUserRole: UserRole;
  isLastActiveAdmin: boolean;
  onSuccess: (newRole: UserRole) => void;
}

export function RoleChangeButton({
  userId,
  currentRole,
  currentUserRole,
  isLastActiveAdmin,
  onSuccess,
}: RoleChangeButtonProps) {
  const { updateRole } = useStaffApi();

  const handleRoleChange = async (newRole: UserRole) => {
    // Prevent changing role of last active admin
    if (currentRole === "admin" && isLastActiveAdmin && newRole !== "admin") {
      toast.error("Không thể thay đổi vai trò của quản trị viên cuối cùng");
      return;
    }

    try {
      await updateRole(userId, newRole);
      onSuccess(newRole);
    } catch (_error) {
      // Error already handled by useStaffApi
    }
  };

  const availableRoles: UserRole[] = React.useMemo(() => {
    if (currentUserRole === "manager") {
      return ["technician", "reception"];
    }
    return ["admin", "manager", "technician", "reception"];
  }, [currentUserRole]);

  return (
    <DropdownMenu>
      <Tooltip>
        <TooltipTrigger asChild>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="sm"
              className="size-9 p-0 text-muted-foreground hover:text-foreground"
              aria-label="Thay đổi vai trò"
              data-testid="role-change-button"
            >
              <IconShield className="size-5" />
            </Button>
          </DropdownMenuTrigger>
        </TooltipTrigger>
        <TooltipContent>
          <p>Thay đổi vai trò</p>
        </TooltipContent>
      </Tooltip>
      <DropdownMenuContent align="end" className="w-40">
        <div className="px-2 py-1.5 text-sm font-medium">
          Thay đổi vai trò
        </div>
        <DropdownMenuSeparator />
        {availableRoles.map((role) => {
          const isCurrentRole = currentRole === role;
          const isDisabled =
            currentRole === "admin" && isLastActiveAdmin && role !== "admin";

          return (
            <DropdownMenuItem
              key={role}
              onClick={() => !isDisabled && handleRoleChange(role)}
              className={`${isCurrentRole ? "bg-accent" : ""} ${isDisabled ? "opacity-50 cursor-not-allowed" : ""}`}
              disabled={isDisabled}
              data-role={role}
              data-testid={`role-option-${role}`}
            >
              {getRoleLabel(role)}
              {isDisabled && (
                <span className="ml-auto text-xs">(Được bảo vệ)</span>
              )}
            </DropdownMenuItem>
          );
        })}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
