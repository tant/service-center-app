"use client";

/**
 * Create Issue Page - REDESIGNED
 * Form for creating new stock issue (simplified types + virtual warehouse IDs)
 */

import { AlertCircle, ArrowLeft, Plus, Save, Trash2 } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";
import { PageHeader } from "@/components/page-header";
import { trpc } from "@/components/providers/trpc-provider";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DatePicker } from "@/components/ui/date-picker";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { validateInventoryDocumentDate } from "@/lib/date-validation";
import type { StockIssueReason } from "@/types/inventory";

// Issue #4: Hide adjustment type - only normal issues allowed
// const ISSUE_TYPES = [
//   { value: "normal", label: "Phiếu xuất bình thường" },
//   { value: "adjustment", label: "Phiếu điều chỉnh (kiểm kê)" },
// ];

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

interface ProductItem {
  productId: string;
  quantity: number;
}

export default function CreateIssuePage() {
  const router = useRouter();
  // Issue #4: Force type to "normal" - adjustment type is hidden
  const issueType = "normal";
  const [virtualWarehouseId, setVirtualWarehouseId] = useState("");
  const [issueDate, setIssueDate] = useState(
    new Date().toISOString().split("T")[0],
  );
  const [dateError, setDateError] = useState<string | undefined>();
  const [notes, setNotes] = useState("");
  const [items, setItems] = useState<ProductItem[]>([]);

  // Recipient information
  const [customerId, setCustomerId] = useState("");
  const [recipientName, setRecipientName] = useState("");
  const [recipientPhone, setRecipientPhone] = useState("");
  const [issueReason, setIssueReason] = useState<StockIssueReason | "">("");

  const createIssue = trpc.inventory.issues.create.useMutation();
  const { data: products } = trpc.products.getProducts.useQuery();
  const { data: virtualWarehouses } =
    trpc.warehouse.listVirtualWarehouses.useQuery();
  const { data: customers } = trpc.customers.getCustomers.useQuery();

  const handleAddItem = () => {
    setItems([...items, { productId: "", quantity: 1 }]);
  };

  const handleRemoveItem = (index: number) => {
    setItems(items.filter((_, i) => i !== index));
  };

  const handleItemChange = (
    index: number,
    field: keyof ProductItem,
    value: any,
  ) => {
    const newItems = [...items];
    newItems[index] = { ...newItems[index], [field]: value };
    setItems(newItems);
  };

  // Issue #16: Validate issue date
  const handleDateChange = (newDate: string) => {
    setIssueDate(newDate);
    const validation = validateInventoryDocumentDate(newDate);
    setDateError(validation.error);
  };

  const handleSubmit = async () => {
    if (!issueType || !virtualWarehouseId || items.length === 0) {
      toast.error("Vui lòng điền đầy đủ thông tin");
      return;
    }

    // Issue #16: Validate issue date
    const dateValidation = validateInventoryDocumentDate(issueDate);
    if (!dateValidation.isValid) {
      toast.error(dateValidation.error || "Ngày xuất không hợp lệ");
      setDateError(dateValidation.error);
      return;
    }

    // Validation: Require customer when issueReason = 'sale'
    if (issueReason === "sale" && !customerId) {
      toast.error("Vui lòng chọn khách hàng khi xuất bán hàng");
      return;
    }

    // Issue #4: Always require positive quantity (adjustment type hidden)
    const invalidItems = items.filter(
      (item) => !item.productId || item.quantity <= 0,
    );
    if (invalidItems.length > 0) {
      toast.error("Số lượng phải lớn hơn 0");
      return;
    }

    try {
      const issue = await createIssue.mutateAsync({
        issueType,
        virtualWarehouseId,
        issueDate,
        notes: notes || undefined,
        // Recipient information
        customerId: customerId || undefined,
        recipientName: recipientName || undefined,
        recipientPhone: recipientPhone || undefined,
        issueReason: issueReason || undefined,
        items: items.map((item) => ({
          productId: item.productId,
          quantity: item.quantity,
        })),
      });

      toast.success("Đã tạo phiếu xuất thành công");
      router.push(`/inventory/documents/issues/${issue.id}`);
    } catch (error: any) {
      toast.error(error.message || "Không thể tạo phiếu xuất");
    }
  };

  return (
    <>
      <PageHeader title="Tạo phiếu xuất kho" />
      <div className="flex flex-1 flex-col">
        <div className="@container/main flex flex-1 flex-col gap-2">
          <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6">
            {/* Back Button */}
            <div className="px-4 lg:px-6">
              <Link href="/inventory/documents">
                <Button variant="ghost" size="sm">
                  <ArrowLeft className="h-4 w-4" />
                  Quay lại
                </Button>
              </Link>
            </div>

            <div className="px-4 lg:px-6 space-y-4">
              {/* Basic Info */}
              <Card>
                <CardHeader>
                  <CardTitle>Thông tin phiếu xuất</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid gap-4 md:grid-cols-2">
                    {/* Issue #4: Hide "Loại phiếu" dropdown - adjustment type removed */}

                    <div className="grid gap-2">
                      <Label>Kho xuất *</Label>
                      <Select
                        value={virtualWarehouseId}
                        onValueChange={setVirtualWarehouseId}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Chọn kho" />
                        </SelectTrigger>
                        <SelectContent>
                          {virtualWarehouses
                            ?.filter(
                              (wh) =>
                                wh.warehouse_type !== "customer_installed",
                            )
                            .map((wh) => (
                              <SelectItem key={wh.id} value={wh.id}>
                                {wh.name}
                              </SelectItem>
                            ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="grid gap-2">
                      <Label htmlFor="issue-date">
                        Ngày xuất *{" "}
                        <span className="ml-2 text-xs font-normal text-muted-foreground">
                          (VD: 010226)
                        </span>
                      </Label>
                      <DatePicker
                        id="issue-date"
                        value={issueDate}
                        onChange={handleDateChange}
                        placeholder="dd/mm/yyyy hoặc click lịch"
                        disabled={createIssue.isPending}
                      />
                      {dateError && (
                        <p className="text-sm text-destructive">{dateError}</p>
                      )}
                    </div>
                  </div>

                  {/* Issue #4: Adjustment alert removed */}

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

              {/* Recipient Info */}
              <Card>
                <CardHeader>
                  <CardTitle>Thông tin người nhận</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="grid gap-2">
                      <Label>Lý do xuất kho</Label>
                      <Select
                        value={issueReason}
                        onValueChange={(v) =>
                          setIssueReason(v as StockIssueReason)
                        }
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Chọn lý do" />
                        </SelectTrigger>
                        <SelectContent>
                          {ISSUE_REASONS.map((reason) => (
                            <SelectItem key={reason.value} value={reason.value}>
                              {reason.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="grid gap-2">
                      <Label
                        className={
                          issueReason === "sale"
                            ? "text-primary font-medium"
                            : ""
                        }
                      >
                        Khách hàng{" "}
                        {issueReason === "sale" && (
                          <span className="text-destructive">*</span>
                        )}
                      </Label>
                      <Select
                        value={customerId || "__none__"}
                        onValueChange={(v) =>
                          setCustomerId(v === "__none__" ? "" : v)
                        }
                      >
                        <SelectTrigger
                          className={
                            issueReason === "sale" && !customerId
                              ? "border-destructive"
                              : ""
                          }
                        >
                          <SelectValue
                            placeholder={
                              issueReason === "sale"
                                ? "Chọn khách hàng (bắt buộc)"
                                : "Chọn khách hàng (nếu có)"
                            }
                          />
                        </SelectTrigger>
                        <SelectContent>
                          {issueReason !== "sale" && (
                            <SelectItem value="__none__">
                              -- Không chọn --
                            </SelectItem>
                          )}
                          {customers?.map((customer) => (
                            <SelectItem key={customer.id} value={customer.id}>
                              {customer.name}{" "}
                              {customer.phone ? `(${customer.phone})` : ""}
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

              {/* Items */}
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle>Danh sách sản phẩm</CardTitle>
                    <Button variant="outline" size="sm" onClick={handleAddItem}>
                      <Plus className="h-4 w-4" />
                      Thêm sản phẩm
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  {items.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                      Chưa có sản phẩm. Nhấn "Thêm sản phẩm" để bắt đầu.
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {items.map((item, index) => (
                        <div key={index} className="flex items-end gap-2">
                          <div className="flex-1 grid gap-2">
                            <Label>Sản phẩm</Label>
                            <Select
                              value={item.productId}
                              onValueChange={(value) =>
                                handleItemChange(index, "productId", value)
                              }
                            >
                              <SelectTrigger>
                                <SelectValue placeholder="Chọn sản phẩm" />
                              </SelectTrigger>
                              <SelectContent>
                                {products?.map((product) => (
                                  <SelectItem
                                    key={product.id}
                                    value={product.id}
                                  >
                                    {product.name}{" "}
                                    {product.sku ? `(${product.sku})` : ""}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>

                          <div className="w-32 grid gap-2">
                            <Label>Số lượng</Label>
                            <Input
                              type="number"
                              min="1"
                              value={item.quantity}
                              onChange={(e) =>
                                handleItemChange(
                                  index,
                                  "quantity",
                                  e.target.value === ""
                                    ? 0
                                    : Number.parseInt(e.target.value),
                                )
                              }
                            />
                          </div>

                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleRemoveItem(index)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Submit */}
              <div className="flex justify-end gap-2">
                <Link href="/inventory/documents">
                  <Button variant="outline">Hủy</Button>
                </Link>
                <Button onClick={handleSubmit} disabled={createIssue.isPending}>
                  <Save className="h-4 w-4" />
                  Tạo phiếu xuất
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
