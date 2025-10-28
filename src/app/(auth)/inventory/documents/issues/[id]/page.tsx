"use client";

/**
 * Issue Detail Page
 * Allows viewing and editing stock issue details
 */

import { use } from "react";
import { useRouter } from "next/navigation";
import { trpc } from "@/components/providers/trpc-provider";
import { PageHeader } from "@/components/page-header";
import { IssueDetailHeader } from "@/components/inventory/documents/issue-detail-header";
import { IssueItemsTable } from "@/components/inventory/documents/issue-items-table";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Send, Trash2 } from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";

interface IssueDetailPageProps {
  params: Promise<{ id: string }>;
}

export default function IssueDetailPage({ params }: IssueDetailPageProps) {
  const router = useRouter();
  const { id } = use(params);

  const { data: issue, isLoading, refetch } = trpc.inventory.issues.getById.useQuery({ id });
  const submitForApproval = trpc.inventory.issues.submitForApproval.useMutation();
  const deleteIssue = trpc.inventory.issues.delete.useMutation();

  const handleSubmitForApproval = async () => {
    try {
      await submitForApproval.mutateAsync({ id });
      toast.success("Đã gửi phiếu xuất để duyệt");
      refetch();
    } catch (error: any) {
      toast.error(error.message || "Không thể gửi phiếu xuất");
    }
  };

  const handleDelete = async () => {
    if (!confirm("Bạn có chắc chắn muốn xóa phiếu xuất này?")) {
      return;
    }

    try {
      await deleteIssue.mutateAsync({ id });
      toast.success("Đã xóa phiếu xuất");
      router.push("/inventory/documents");
    } catch (error: any) {
      toast.error(error.message || "Không thể xóa phiếu xuất");
    }
  };

  if (isLoading) {
    return (
      <>
        <PageHeader title="Chi tiết phiếu xuất" />
        <div className="flex flex-1 flex-col">
          <div className="@container/main flex flex-1 flex-col gap-2">
            <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6">
              <div className="px-4 lg:px-6">
                <div className="text-center py-8 text-muted-foreground">
                  Đang tải...
                </div>
              </div>
            </div>
          </div>
        </div>
      </>
    );
  }

  if (!issue) {
    return (
      <>
        <PageHeader title="Chi tiết phiếu xuất" />
        <div className="flex flex-1 flex-col">
          <div className="@container/main flex flex-1 flex-col gap-2">
            <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6">
              <div className="px-4 lg:px-6">
                <div className="text-center py-8 text-muted-foreground">
                  Không tìm thấy phiếu xuất
                </div>
              </div>
            </div>
          </div>
        </div>
      </>
    );
  }

  // Check if all items have complete serials
  const allItemsComplete = issue.items?.every(
    (item) => (item.serials?.length || 0) === item.quantity
  );

  const canSubmitForApproval = issue.status === "draft" && allItemsComplete;
  const canDelete = issue.status === "draft";

  return (
    <>
      <PageHeader title="Chi tiết phiếu xuất" />
      <div className="flex flex-1 flex-col">
        <div className="@container/main flex flex-1 flex-col gap-2">
          <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6">
            {/* Back Button and Actions */}
            <div className="flex items-center justify-between px-4 lg:px-6">
              <Link href="/inventory/documents">
                <Button variant="ghost" size="sm">
                  <ArrowLeft className="h-4 w-4" />
                  Quay lại
                </Button>
              </Link>

              <div className="flex items-center gap-2">
                {canDelete && (
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={handleDelete}
                    disabled={deleteIssue.isPending}
                  >
                    <Trash2 className="h-4 w-4" />
                    <span className="hidden lg:inline">Xóa phiếu</span>
                  </Button>
                )}

                {canSubmitForApproval && (
                  <Button
                    variant="default"
                    size="sm"
                    onClick={handleSubmitForApproval}
                    disabled={submitForApproval.isPending}
                  >
                    <Send className="h-4 w-4" />
                    <span className="hidden lg:inline">Gửi duyệt</span>
                  </Button>
                )}
              </div>
            </div>

            {/* Content */}
            <div className="px-4 lg:px-6 space-y-4">
              <IssueDetailHeader issue={issue} />
              <IssueItemsTable issue={issue} onSerialsSelected={() => refetch()} />

              {!allItemsComplete && issue.status === "draft" && (
                <div className="rounded-md border border-yellow-300 bg-yellow-50 dark:bg-yellow-900/30 dark:border-yellow-700 p-4">
                  <div className="text-sm text-yellow-800 dark:text-yellow-300">
                    Vui lòng chọn đầy đủ số serial cho tất cả sản phẩm trước khi gửi duyệt
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
