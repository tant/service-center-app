"use client";

import { toast } from "sonner";
import { trpc } from "@/components/providers/trpc-provider";
import { getRoleLabel, type UserRole } from "@/lib/constants/roles";

export function useStaffApi() {
  const utils = trpc.useUtils();

  const createMutation = trpc.staff.create.useMutation({
    onSuccess: () => {
      toast.success("Tạo nhân viên thành công");
      utils.staff.list.invalidate();
    },
    onError: (error) => {
      toast.error(error.message || "Không thể tạo nhân viên");
    },
  });

  const updateMutation = trpc.staff.update.useMutation({
    onSuccess: () => {
      utils.staff.list.invalidate();
    },
    onError: (error) => {
      toast.error(error.message || "Không thể cập nhật thông tin");
    },
  });

  const resetPasswordMutation = trpc.staff.resetPassword.useMutation({
    onError: (error) => {
      toast.error(error.message || "Không thể đặt lại mật khẩu");
    },
  });

  const updateRole = async (userId: string, newRole: UserRole) => {
    const roleLabel = getRoleLabel(newRole);
    const result = await updateMutation.mutateAsync({
      user_id: userId,
      role: newRole,
    });
    toast.success(`Vai trò đã được cập nhật thành ${roleLabel}`);
    return result;
  };

  const resetPassword = async (
    userId: string,
    newPassword: string,
    fullName: string,
  ) => {
    const result = await resetPasswordMutation.mutateAsync({
      user_id: userId,
      new_password: newPassword,
    });
    toast.success(`Đặt lại mật khẩu thành công cho ${fullName}`);
    return result;
  };

  const toggleActive = async (userId: string, newStatus: boolean) => {
    const result = await updateMutation.mutateAsync({
      user_id: userId,
      is_active: newStatus,
    });
    toast.success(
      `Tài khoản đã được ${newStatus ? "kích hoạt" : "vô hiệu hóa"}`,
    );
    return result;
  };

  const createStaff = async (data: {
    full_name: string;
    email: string;
    password: string;
    role: UserRole;
  }) => {
    return createMutation.mutateAsync(data);
  };

  const updateStaff = async (
    userId: string,
    data: {
      full_name: string;
      email: string;
      role: UserRole;
      is_active: boolean;
      avatar_url: string | null;
    },
  ) => {
    const result = await updateMutation.mutateAsync({
      user_id: userId,
      ...data,
    });
    toast.success("Cập nhật thông tin nhân viên thành công");
    return result;
  };

  return {
    updateRole,
    resetPassword,
    toggleActive,
    createStaff,
    updateStaff,
  };
}
