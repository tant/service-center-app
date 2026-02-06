import { toast } from "sonner";
import type { UserRole } from "@/lib/constants/roles";
import { getRoleLabel } from "@/lib/constants/roles";

interface ApiCallOptions {
  url: string;
  method: string;
  body?: any;
  showSuccessToast?: boolean;
  successMessage?: string;
  errorMessage?: string;
}

async function apiCall({
  url,
  method,
  body,
  showSuccessToast = true,
  successMessage,
  errorMessage,
}: ApiCallOptions) {
  try {
    const response = await fetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: body ? JSON.stringify(body) : undefined,
    });

    const result = await response.json();
    if (!response.ok) {
      throw new Error(result.error || "API call failed");
    }

    if (showSuccessToast && successMessage) {
      toast.success(successMessage);
    }

    return result;
  } catch (error) {
    const message =
      error instanceof Error ? error.message : errorMessage || "Có lỗi xảy ra";
    console.error(`[Staff API] Error:`, message, error);
    toast.error(message);
    throw error;
  }
}

export function useStaffApi() {
  const updateRole = async (userId: string, newRole: UserRole) => {
    const roleLabel = getRoleLabel(newRole);
    return apiCall({
      url: "/api/staff",
      method: "PATCH",
      body: { user_id: userId, role: newRole },
      successMessage: `Vai trò đã được cập nhật thành ${roleLabel}`,
      errorMessage: "Không thể thay đổi vai trò",
    });
  };

  const resetPassword = async (
    userId: string,
    newPassword: string,
    fullName: string,
  ) => {
    return apiCall({
      url: "/api/staff/reset-password",
      method: "POST",
      body: { user_id: userId, new_password: newPassword },
      successMessage: `Đặt lại mật khẩu thành công cho ${fullName}`,
      errorMessage: "Không thể đặt lại mật khẩu",
    });
  };

  const toggleActive = async (userId: string, newStatus: boolean) => {
    return apiCall({
      url: "/api/staff",
      method: "PATCH",
      body: { user_id: userId, is_active: newStatus },
      successMessage: `Tài khoản đã được ${newStatus ? "kích hoạt" : "vô hiệu hóa"}`,
      errorMessage: "Không thể thay đổi trạng thái tài khoản",
    });
  };

  const createStaff = async (data: {
    full_name: string;
    email: string;
    password: string;
    role: UserRole;
  }) => {
    return apiCall({
      url: "/api/staff",
      method: "POST",
      body: data,
      successMessage: "Tạo nhân viên thành công",
      errorMessage: "Không thể tạo nhân viên",
    });
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
    return apiCall({
      url: "/api/staff",
      method: "PATCH",
      body: { user_id: userId, ...data },
      successMessage: "Cập nhật thông tin nhân viên thành công",
      errorMessage: "Không thể cập nhật thông tin",
    });
  };

  return {
    updateRole,
    resetPassword,
    toggleActive,
    createStaff,
    updateStaff,
  };
}
