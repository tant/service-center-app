"use client";

/**
 * Transfer Detail Page
 * Allows viewing and editing stock transfer details
 */

import { use } from "react";
import { useRouter } from "next/navigation";
import { trpc } from "@/components/providers/trpc-provider";
import { PageHeader } from "@/components/page-header";
import { TransferDetailHeader } from "@/components/inventory/documents/transfer-detail-header";
import { TransferItemsTable } from "@/components/inventory/documents/transfer-items-table";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Send, Trash2, CheckCircle } from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";

interface TransferDetailPageProps {
  params: Promise<{ id: string }>;
}

export default function TransferDetailPage({ params }: TransferDetailPageProps) {
  const router = useRouter();
  const { id } = use(params);

  const { data: transfer, isLoading, refetch } = trpc.inventory.transfers.getById.useQuery({ id });
  const submitForApproval = trpc.inventory.transfers.submitForApproval.useMutation();
  const confirmReceived = trpc.inventory.transfers.confirmReceived.useMutation();
  const deleteTransfer = trpc.inventory.transfers.delete.useMutation();

  const handleSubmitForApproval = async () => {
    try {
      await submitForApproval.mutateAsync({ id });
      toast.success("Đã gửi phiếu chuyển để duyệt");
      refetch();
    } catch (error: any) {
      toast.error(error.message || "Không thể gửi phiếu chuyển");
    }
  };

  const handleConfirmReceived = async () => {
    if (!confirm("Xác nhận đã nhận hàng? Hành động này sẽ hoàn thành phiếu chuyển kho.")) {
      return;
    }

    try {
      await confirmReceived.mutateAsync({ id });
      toast.success("Đã xác nhận nhận hàng và hoàn thành phiếu chuyển");
      refetch();
    } catch (error: any) {
      toast.error(error.message || "Không thể xác nhận nhận hàng");
    }
  };

  const handleDelete = async () => {
    if (!confirm("Bạn có chắc chắn muốn xóa phiếu chuyển này?")) {
      return;
    }

    try {
      await deleteTransfer.mutateAsync({ id });
      toast.success("Đã xóa phiếu chuyển");
      router.push("/inventory/documents");
    } catch (error: any) {
      toast.error(error.message || "Không thể xóa phiếu chuyển");
    }
  };

  if (isLoading) {
    return (
      <>
        <PageHeader title="Chi tiết phiếu chuyển" />
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

  if (!transfer) {
    return (
      <>
        <PageHeader title="Chi tiết phiếu chuyển" />
        <div className="flex flex-1 flex-col">
          <div className="@container/main flex flex-1 flex-col gap-2">
            <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6">
              <div className="px-4 lg:px-6">
                <div className="text-center py-8 text-muted-foreground">
                  Không tìm thấy phiếu chuyển
                </div>
              </div>
            </div>
          </div>
        </div>
      </>
    );
  }

  // Check if all items have complete serials
  const allItemsComplete = transfer.items?.every(
    (item: any) => (item.serials?.length || 0) === item.quantity
  );

  const canSubmitForApproval = transfer.status === "draft" && allItemsComplete;
  const canConfirmReceived = transfer.status === "in_transit" && allItemsComplete;
  const canDelete = transfer.status === "draft";

  return (
    <>
      <PageHeader title="Chi tiết phiếu chuyển" />
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
                    disabled={deleteTransfer.isPending}
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

                {canConfirmReceived && (
                  <Button
                    variant="default"
                    size="sm"
                    onClick={handleConfirmReceived}
                    disabled={confirmReceived.isPending}
                  >
                    <CheckCircle className="h-4 w-4" />
                    <span className="hidden lg:inline">Xác nhận nhận hàng</span>
                  </Button>
                )}
              </div>
            </div>

            {/* Content */}
            <div className="px-4 lg:px-6 space-y-4">
              <TransferDetailHeader transfer={transfer} />
              <TransferItemsTable transfer={transfer} onSerialsSelected={() => refetch()} />

              {!allItemsComplete && (transfer.status === "draft" || transfer.status === "in_transit") && (
                <div className="rounded-md border border-yellow-300 bg-yellow-50 dark:bg-yellow-900/30 dark:border-yellow-700 p-4">
                  <div className="text-sm text-yellow-800 dark:text-yellow-300">
                    {transfer.status === "draft"
                      ? "Vui lòng chọn đầy đủ số serial cho tất cả sản phẩm trước khi gửi duyệt"
                      : "Vui lòng chọn đầy đủ số serial cho tất cả sản phẩm trước khi xác nhận nhận hàng"}
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
