import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { publicProcedure, router } from "../trpc";

const DEFAULT_WORKFLOWS_KEY = "default_workflows";

const getSettingsInput = z.object({
  keys: z.array(z.string().min(1)).min(1),
});

const upsertSettingsInput = z.object({
  settings: z
    .array(
      z.object({
        key: z.string().min(1),
        value: z.any(),
        category: z.string().optional(),
        description: z.string().optional(),
      }),
    )
    .min(1),
});

type SupabaseCtx = {
  supabaseClient: any;
  supabaseAdmin: any;
};

async function getAuthUser(ctx: SupabaseCtx) {
  const {
    data: { user },
    error: authError,
  } = await ctx.supabaseClient.auth.getUser();

  if (authError || !user) {
    throw new TRPCError({
      code: "UNAUTHORIZED",
      message: "Bạn cần đăng nhập để truy cập cài đặt.",
    });
  }

  return user;
}

async function getProfile(ctx: SupabaseCtx, userId: string) {
  const { data: profile, error: profileError } = await ctx.supabaseAdmin
    .from("profiles")
    .select("id, role")
    .eq("user_id", userId)
    .single();

  if (profileError || !profile) {
    throw new TRPCError({
      code: "INTERNAL_SERVER_ERROR",
      message: "Không lấy được hồ sơ người dùng.",
    });
  }

  return profile as { id: string; role: string };
}

function assertAdminOrManager(role: string) {
  if (!["admin", "manager"].includes(role)) {
    throw new TRPCError({
      code: "FORBIDDEN",
      message: "Chỉ admin/manager được phép cập nhật cài đặt.",
    });
  }
}

function collectWorkflowIds(value: unknown) {
  if (value === null || typeof value !== "object" || Array.isArray(value)) {
    throw new TRPCError({
      code: "BAD_REQUEST",
      message:
        "default_workflows phải là object mapping ticket_type → workflow_id.",
    });
  }

  const ids = Object.values(value)
    .filter(Boolean)
    .map((id) => {
      if (typeof id !== "string") {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Giá trị workflow_id phải là chuỗi UUID.",
        });
      }
      return id;
    });

  return Array.from(new Set(ids));
}

async function validateDefaultWorkflows(ctx: SupabaseCtx, value: unknown) {
  const ids = collectWorkflowIds(value);
  if (ids.length === 0) {
    return;
  }

  const { data, error } = await ctx.supabaseAdmin
    .from("workflows")
    .select("id")
    .in("id", ids);

  if (error) {
    throw new TRPCError({
      code: "INTERNAL_SERVER_ERROR",
      message: `Không thể kiểm tra workflow: ${error.message}`,
    });
  }

  const found = new Set((data || []).map((row: { id: string }) => row.id));
  const missing = ids.filter((id) => !found.has(id));

  if (missing.length > 0) {
    throw new TRPCError({
      code: "BAD_REQUEST",
      message: `Workflow không tồn tại: ${missing.join(", ")}`,
    });
  }
}

export const appSettingsRouter = router({
  getSettings: publicProcedure
    .input(getSettingsInput)
    .query(async ({ ctx, input }) => {
      const user = await getAuthUser(ctx);
      // Cho phép mọi user đăng nhập đọc (server dùng service role, RLS vẫn an toàn)
      const { data, error } = await ctx.supabaseAdmin
        .from("system_settings")
        .select("key, value")
        .in("key", input.keys);

      if (error) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: `Không thể tải cài đặt: ${error.message}`,
        });
      }

      const result: Record<string, unknown> = {};
      (data || []).forEach((row: { key: string; value: unknown }) => {
        result[row.key] = row.value;
      });

      // Đảm bảo trả về null cho key chưa tồn tại
      input.keys.forEach((key) => {
        if (!(key in result)) {
          result[key] = null;
        }
      });

      return result;
    }),

  upsertSettings: publicProcedure
    .input(upsertSettingsInput)
    .mutation(async ({ ctx, input }) => {
      const user = await getAuthUser(ctx);
      const profile = await getProfile(ctx, user.id);
      assertAdminOrManager(profile.role);

      // Validate default_workflows nếu có
      const defaultWorkflowSetting = input.settings.find(
        (item) => item.key === DEFAULT_WORKFLOWS_KEY,
      );
      if (defaultWorkflowSetting) {
        await validateDefaultWorkflows(ctx, defaultWorkflowSetting.value);
      }

      const payload = input.settings.map((setting) => ({
        key: setting.key,
        value: setting.value,
        category: setting.category ?? "general",
        description: setting.description ?? null,
        updated_by: profile.id,
        updated_at: new Date().toISOString(),
      }));

      const { error } = await ctx.supabaseAdmin
        .from("system_settings")
        .upsert(payload, { onConflict: "key" });

      if (error) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: `Không thể lưu cài đặt: ${error.message}`,
        });
      }

      return { success: true, updated: payload.length };
    }),
});
