"use client";

import { IconUserCheck, IconUserX } from "@tabler/icons-react";
import * as React from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useStaffApi } from "@/hooks/use-staff-api";

interface ToggleActiveButtonProps {
  userId: string;
  isActive: boolean;
  isLastActiveAdmin: boolean;
  onSuccess: (newStatus: boolean) => void;
}

export function ToggleActiveButton({
  userId,
  isActive,
  isLastActiveAdmin,
  onSuccess,
}: ToggleActiveButtonProps) {
  const { toggleActive } = useStaffApi();

  const handleToggle = async () => {
    // Prevent deactivating the last active admin
    if (isLastActiveAdmin && isActive) {
      toast.error(
        "Không thể vô hiệu hóa tài khoản quản trị viên cuối cùng. Vui lòng nâng cấp người dùng khác lên quản trị viên trước.",
        { duration: 5000 },
      );
      return;
    }

    const newStatus = !isActive;
    try {
      await toggleActive(userId, newStatus);
      onSuccess(newStatus);
    } catch (error) {
      // Error already handled by useStaffApi
    }
  };

  const isDisabled = isLastActiveAdmin && isActive;

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          className={`size-9 p-0 ${
            isDisabled ? "opacity-50 cursor-not-allowed" : ""
          } ${isActive ? "text-green-600 hover:text-green-700" : "text-red-600 hover:text-red-700"}`}
          onClick={handleToggle}
          disabled={isDisabled}
          aria-label={
            isActive ? "Vô hiệu hóa tài khoản" : "Kích hoạt tài khoản"
          }
          data-testid="toggle-active-button"
        >
          {isActive ? (
            <IconUserCheck className="size-5" />
          ) : (
            <IconUserX className="size-5" />
          )}
        </Button>
      </TooltipTrigger>
      <TooltipContent>
        <p>
          {isDisabled
            ? "Không thể vô hiệu hóa quản trị viên cuối cùng"
            : isActive
              ? "Nhấn để vô hiệu hóa tài khoản"
              : "Nhấn để kích hoạt tài khoản"}
        </p>
      </TooltipContent>
    </Tooltip>
  );
}
