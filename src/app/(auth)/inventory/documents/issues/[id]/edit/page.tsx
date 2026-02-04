"use client";

/**
 * Edit Issue Page
 * Form for editing stock issue (recipient info, notes only - items cannot be changed)
 */

import { use, useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { trpc } from "@/components/providers/trpc-provider";
import { PageHeader } from "@/components/page-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { ArrowLeft, Save, Info } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import Link from "next/link";
import { toast } from "sonner";
import type { StockIssueReason } from "@/types/inventory";

// Issue reason labels
const ISSUE_REASONS: { value: StockIssueReason; label: string }[] = [
  { value: "sale", label: "Bán hàng" },
  { value: "warranty_replacement", label: "Đổi bảo hành" },
  { value: "repair", label: "Sửa chữa (linh kiện)" },
  { value: "internal_use", label: "Sử dụng nội bộ" },
  { value: "sample", label: "Hàng mẫu" },
  { value: "gift", label: "Quà tặng" },
  { value: "return_to_supplier", label: "Trả nhà cung cấp" },
  { value: "damage", label: "Hàng hỏng/mất" },
  { value: "other", label: "Khác" },
];

interface EditIssuePageProps {
  params: Promise<{ id: string }>;
}

export default function EditIssuePage({ params }: EditIssuePageProps) {
  const router = useRouter();
  const { id } = use(params);

  // Editable fields
  const [notes, setNotes] = useState("");
  const [referenceDocumentNumber, setReferenceDocumentNumber] = useState("");
  const [customerId, setCustomerId] = useState<string | null>(null);
  const [recipientName, setRecipientName] = useState("");
  const [recipientPhone, setRecipientPhone] = useState("");
  const [issueReason, setIssueReason] = useState<StockIssueReason | "">("");
  const [isInitialized, setIsInitialized] = useState(false);

  const { data: issue, isLoading: issueLoading } = trpc.inventory.issues.getById.useQuery({ id });
  const updateIssue = trpc.inventory.issues.update.useMutation();
  const { data: customers } = trpc.customers.getCustomers.useQuery();

  // Initialize form with existing data
  useEffect(() => {
    if (issue && !isInitialized) {
      setNotes(issue.notes || "");
      setReferenceDocumentNumber(issue.reference_document_number || "");
      setCustomerId(issue.customer_id);
      setRecipientName(issue.recipient_name || "");
      setRecipientPhone(issue.recipient_phone || "");
      setIssueReason(issue.issue_reason || "");
      setIsInitialized(true);
    }
  }, [issue, isInitialized]);

  const handleSubmit = async () => {
    try {
      await updateIssue.mutateAsync({
        id,
        notes: notes || undefined,
        referenceDocumentNumber: referenceDocumentNumber || undefined,
        customerId: customerId,
        recipientName: recipientName || undefined,
        recipientPhone: recipientPhone || undefined,
        issueReason: issueReason || undefined,
      });

      toast.success("Đã cập nhật phiếu xuất thành công");
      router.push(`/inventory/documents/issues/${id}`);
    } catch (error: any) {
      toast.error(error.message || "Không thể cập nhật phiếu xuất");
    }
  };

  if (issueLoading) {
    return (
      <>
        <PageHeader title="Chỉnh sửa phiếu xuất" />
        <div className="flex flex-1 flex-col">
          <div className="@container/main flex flex-1 flex-col gap-2">
            <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6">
              <div className="px-4 lg:px-6">
                <div className="text-center py-8 text-muted-foreground">Đang tải...</div>
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
        <PageHeader title="Chỉnh sửa phiếu xuất" />
        <div className="flex flex-1 flex-col">
          <div className="@container/main flex flex-1 flex-col gap-2">
            <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6">
              <div className="px-4 lg:px-6">
                <div className="text-center py-8 text-muted-foreground">Không tìm thấy phiếu xuất</div>
              </div>
            </div>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <PageHeader title={`Chỉnh sửa phiếu xuất ${issue.issue_number || ""}`} />
      <div className="flex flex-1 flex-col">
        <div className="@container/main flex flex-1 flex-col gap-2">
          <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6">
            {/* Back Button */}
            <div className="px-4 lg:px-6">
              <Link href={`/inventory/documents/issues/${id}`}>
                <Button variant="ghost" size="sm">
                  <ArrowLeft className="h-4 w-4" />
                  Quay lại
                </Button>
              </Link>
            </div>

            <div className="px-4 lg:px-6 space-y-4">
              {/* Info Alert */}
              <Alert>
                <Info className="h-4 w-4" />
                <AlertDescription>
                  Phiếu xuất đã hoàn tất. Chỉ có thể chỉnh sửa thông tin người nhận, ghi chú và số chứng từ tham chiếu.
                </AlertDescription>
              </Alert>

              {/* Recipient Info */}
              <Card>
                <CardHeader>
                  <CardTitle>Thông tin người nhận</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="grid gap-2">
                      <Label>Lý do xuất kho</Label>
                      <Select value={issueReason} onValueChange={(v) => setIssueReason(v as StockIssueReason)}>
                        <SelectTrigger>
                          <SelectValue placeholder="Chọn lý do" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="">-- Không chọn --</SelectItem>
                          {ISSUE_REASONS.map((reason) => (
                            <SelectItem key={reason.value} value={reason.value}>
                              {reason.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="grid gap-2">
                      <Label>Khách hàng</Label>
                      <Select value={customerId || ""} onValueChange={(v) => setCustomerId(v || null)}>
                        <SelectTrigger>
                          <SelectValue placeholder="Chọn khách hàng (nếu có)" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="">-- Không chọn --</SelectItem>
                          {customers?.map((customer) => (
                            <SelectItem key={customer.id} value={customer.id}>
                              {customer.name} {customer.phone ? `(${customer.phone})` : ""}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="grid gap-2">
                      <Label>Tên người nhận</Label>
                      <Input
                        placeholder="Nhập tên người nhận (nếu không phải khách hàng)"
                        value={recipientName}
                        onChange={(e) => setRecipientName(e.target.value)}
                      />
                    </div>

                    <div className="grid gap-2">
                      <Label>SĐT người nhận</Label>
                      <Input
                        placeholder="Nhập số điện thoại"
                        value={recipientPhone}
                        onChange={(e) => setRecipientPhone(e.target.value)}
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Notes */}
              <Card>
                <CardHeader>
                  <CardTitle>Thông tin bổ sung</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid gap-2">
                    <Label>Số chứng từ tham chiếu</Label>
                    <Input
                      placeholder="Nhập số hóa đơn, số hợp đồng..."
                      value={referenceDocumentNumber}
                      onChange={(e) => setReferenceDocumentNumber(e.target.value)}
                    />
                  </div>

                  <div className="grid gap-2">
                    <Label>Ghi chú</Label>
                    <Textarea
                      placeholder="Ghi chú về phiếu xuất..."
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      rows={3}
                    />
                  </div>
                </CardContent>
              </Card>

              {/* Submit */}
              <div className="flex justify-end gap-2">
                <Link href={`/inventory/documents/issues/${id}`}>
                  <Button variant="outline">Hủy</Button>
                </Link>
                <Button onClick={handleSubmit} disabled={updateIssue.isPending}>
                  <Save className="h-4 w-4" />
                  Lưu thay đổi
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
