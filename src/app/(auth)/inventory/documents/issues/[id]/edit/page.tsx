"use client";

/**
 * Edit Issue Page
 * Form for editing draft stock issues
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
import { ArrowLeft, Plus, Trash2, Save, AlertCircle } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import Link from "next/link";
import { toast } from "sonner";

const ISSUE_TYPES = [
  { value: "normal", label: "Phiếu xuất bình thường" },
  { value: "adjustment", label: "Phiếu điều chỉnh (kiểm kê)" },
];

interface ProductItem {
  id?: string;
  productId: string;
  quantity: number;
}

interface EditIssuePageProps {
  params: Promise<{ id: string }>;
}

export default function EditIssuePage({ params }: EditIssuePageProps) {
  const router = useRouter();
  const { id } = use(params);

  const [issueType, setIssueType] = useState<"normal" | "adjustment">("normal");
  const [virtualWarehouseId, setVirtualWarehouseId] = useState("");
  const [toVirtualWarehouseId, setToVirtualWarehouseId] = useState("");
  const [issueDate, setIssueDate] = useState(new Date().toISOString().split("T")[0]);
  const [notes, setNotes] = useState("");
  const [items, setItems] = useState<ProductItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const { data: issue, isLoading: issueLoading } = trpc.inventory.issues.getById.useQuery({ id });
  const updateIssue = trpc.inventory.issues.updateFull.useMutation();
  const { data: products } = trpc.products.getProducts.useQuery();
  const { data: virtualWarehouses } = trpc.warehouse.listVirtualWarehouses.useQuery({ isArchive: false });
  const { data: archiveWarehouses } = trpc.warehouse.listVirtualWarehouses.useQuery({ isArchive: true });

  // Load existing issue data
  useEffect(() => {
    if (issue && !issueLoading) {
      // Check if issue can be edited
      if (issue.status !== "draft") {
        toast.error("Chỉ có thể chỉnh sửa phiếu xuất ở trạng thái bản nháp");
        router.push(`/inventory/documents/issues/${id}`);
        return;
      }

      setIssueType(issue.issue_type as "normal" | "adjustment");
      setVirtualWarehouseId(issue.virtual_warehouse_id || "");
      setToVirtualWarehouseId((issue as any).to_virtual_warehouse_id || "");
      setIssueDate(issue.issue_date?.split("T")[0] || new Date().toISOString().split("T")[0]);
      setNotes(issue.notes || "");

      // Load items
      if (issue.items && Array.isArray(issue.items)) {
        setItems(
          issue.items.map((item: any) => ({
            id: item.id,
            productId: item.product_id,
            quantity: item.quantity,
          }))
        );
      }

      setIsLoading(false);
    }
  }, [issue, issueLoading, router, id]);

  const handleAddItem = () => {
    setItems([...items, { productId: "", quantity: 1 }]);
  };

  const handleRemoveItem = (index: number) => {
    setItems(items.filter((_, i) => i !== index));
  };

  const handleItemChange = (index: number, field: keyof ProductItem, value: any) => {
    const newItems = [...items];
    newItems[index] = { ...newItems[index], [field]: value };
    setItems(newItems);
  };

  const handleSubmit = async () => {
    if (!issueType || !virtualWarehouseId || !toVirtualWarehouseId || items.length === 0) {
      toast.error("Vui lòng điền đầy đủ thông tin");
      return;
    }

    // Validate based on type
    if (issueType === "normal") {
      const invalidItems = items.filter((item) => !item.productId || item.quantity <= 0);
      if (invalidItems.length > 0) {
        toast.error("Phiếu xuất bình thường phải có số lượng dương");
        return;
      }
    } else {
      // Adjustment: allow negative but not zero
      const invalidItems = items.filter((item) => !item.productId || item.quantity === 0);
      if (invalidItems.length > 0) {
        toast.error("Số lượng không được bằng 0");
        return;
      }
    }

    try {
      await updateIssue.mutateAsync({
        id,
        issueType,
        virtualWarehouseId,
        toVirtualWarehouseId,
        issueDate,
        notes: notes || undefined,
        items: items.map((item) => ({
          id: item.id,
          productId: item.productId,
          quantity: item.quantity,
        })),
      });

      toast.success("Đã cập nhật phiếu xuất thành công");
      router.push(`/inventory/documents/issues/${id}`);
    } catch (error: any) {
      toast.error(error.message || "Không thể cập nhật phiếu xuất");
    }
  };

  if (issueLoading || isLoading) {
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
              {/* Basic Info */}
              <Card>
                <CardHeader>
                  <CardTitle>Thông tin phiếu xuất</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="grid gap-2">
                      <Label>Loại phiếu *</Label>
                      <Select value={issueType} onValueChange={(v) => setIssueType(v as "normal" | "adjustment")}>
                        <SelectTrigger>
                          <SelectValue placeholder="Chọn loại phiếu" />
                        </SelectTrigger>
                        <SelectContent>
                          {ISSUE_TYPES.map((type) => (
                            <SelectItem key={type.value} value={type.value}>
                              {type.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="grid gap-2">
                      <Label>Kho xuất *</Label>
                      <Select value={virtualWarehouseId} onValueChange={setVirtualWarehouseId}>
                        <SelectTrigger>
                          <SelectValue placeholder="Chọn kho" />
                        </SelectTrigger>
                        <SelectContent>
                          {virtualWarehouses?.map((wh) => (
                            <SelectItem key={wh.id} value={wh.id}>
                              {wh.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="grid gap-2">
                      <Label>Kho đích *</Label>
                      <Select value={toVirtualWarehouseId} onValueChange={setToVirtualWarehouseId}>
                        <SelectTrigger>
                          <SelectValue placeholder="Chọn kho đích" />
                        </SelectTrigger>
                        <SelectContent>
                          {archiveWarehouses?.map((wh) => (
                            <SelectItem key={wh.id} value={wh.id}>
                              {wh.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="grid gap-2">
                      <Label>Ngày xuất *</Label>
                      <Input type="date" value={issueDate} onChange={(e) => setIssueDate(e.target.value)} />
                    </div>
                  </div>

                  {issueType === "adjustment" && (
                    <Alert>
                      <AlertCircle className="h-4 w-4" />
                      <AlertDescription>
                        <strong>Phiếu điều chỉnh:</strong> Số dương = giảm stock, số âm = tăng stock. Dùng khi kiểm kê hoặc sửa sai sót.
                      </AlertDescription>
                    </Alert>
                  )}

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
                              onValueChange={(value) => handleItemChange(index, "productId", value)}
                            >
                              <SelectTrigger>
                                <SelectValue placeholder="Chọn sản phẩm" />
                              </SelectTrigger>
                              <SelectContent>
                                {products?.map((product) => (
                                  <SelectItem key={product.id} value={product.id}>
                                    {product.name} {product.sku ? `(${product.sku})` : ""}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>

                          <div className="w-32 grid gap-2">
                            <Label>Số lượng</Label>
                            <Input
                              type="number"
                              min={issueType === "adjustment" ? undefined : "1"}
                              value={item.quantity}
                              onChange={(e) => handleItemChange(index, "quantity", Number.parseInt(e.target.value))}
                              className={item.quantity < 0 ? "text-red-600 font-medium" : ""}
                            />
                          </div>

                          <Button variant="ghost" size="sm" onClick={() => handleRemoveItem(index)}>
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Warning about serials */}
              {issue.items?.some((item: any) => item.serials && item.serials.length > 0) && (
                <div className="rounded-md border border-yellow-300 bg-yellow-50 dark:bg-yellow-900/30 dark:border-yellow-700 p-4">
                  <div className="text-sm text-yellow-800 dark:text-yellow-300">
                    <strong>Lưu ý:</strong> Phiếu xuất này đã có một số serial được chọn. Nếu bạn thay đổi sản phẩm hoặc số lượng, các serial đã chọn có thể bị xóa.
                  </div>
                </div>
              )}

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
