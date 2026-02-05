import { ArrowLeft, Home, ShieldAlert } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

/**
 * Unauthorized Page (403)
 *
 * Shown when a user tries to access a resource they don't have permission for.
 * This page is accessible to authenticated users who don't have the required role.
 */
export default function UnauthorizedPage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-b from-background to-muted/20">
      <div className="mx-auto max-w-md px-6 text-center">
        {/* Icon */}
        <div className="mb-6 flex justify-center">
          <div className="rounded-full bg-destructive/10 p-6">
            <ShieldAlert className="h-16 w-16 text-destructive" />
          </div>
        </div>

        {/* Status Code */}
        <h1 className="mb-4 text-6xl font-bold text-foreground">403</h1>

        {/* Title */}
        <h2 className="mb-3 text-2xl font-semibold text-foreground">
          Không có quyền truy cập
        </h2>

        {/* Description */}
        <p className="mb-8 text-muted-foreground">
          Bạn không có quyền truy cập trang này. Vui lòng liên hệ quản trị viên
          nếu bạn cho rằng đây là nhầm lẫn.
        </p>

        {/* Actions */}
        <div className="flex flex-col gap-3 sm:flex-row sm:justify-center">
          <Button asChild variant="default">
            <Link href="/dashboard">
              <Home className="mr-2 h-4 w-4" />
              Về trang chủ
            </Link>
          </Button>

          <Button
            asChild
            variant="outline"
            onClick={() => window.history.back()}
          >
            <a>
              <ArrowLeft className="mr-2 h-4 w-4" />
              Quay lại
            </a>
          </Button>
        </div>

        {/* Additional Help */}
        <div className="mt-12 rounded-lg border bg-card p-4 text-left">
          <h3 className="mb-2 font-semibold">Cần trợ giúp?</h3>
          <ul className="space-y-1 text-sm text-muted-foreground">
            <li>• Kiểm tra bạn đã đăng nhập với tài khoản đúng chưa</li>
            <li>• Liên hệ quản trị viên để được cấp quyền truy cập</li>
            <li>• Xem lại các quyền của tài khoản trong phần cài đặt</li>
          </ul>
        </div>
      </div>
    </div>
  );
}

/**
 * Metadata for the unauthorized page
 */
export const metadata = {
  title: "403 - Không có quyền truy cập",
  description: "Bạn không có quyền truy cập trang này",
};
