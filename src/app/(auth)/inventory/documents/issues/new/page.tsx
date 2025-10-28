"use client";

/**
 * Create Issue Page
 * Form for creating new stock issue
 */

import { useState } from "react";
import { useRouter } from "next/navigation";
import { trpc } from "@/components/providers/trpc-provider";
import { PageHeader } from "@/components/page-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { ArrowLeft, Plus, Trash2, Save } from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";

const ISSUE_TYPES = [
  { value: "warranty_return", label: "Xuất trả bảo hành" },
  { value: "parts_usage", label: "Xuất sử dụng linh kiện" },
  { value: "rma_out", label: "Xuất RMA" },
  { value: "transfer_out", label: "Xuất chuyển kho" },
  { value: "disposal", label: "Xuất thanh lý" },
  { value: "adjustment_out", label: "Điều chỉnh xuất" },
];

const WAREHOUSE_TYPES = [
  { value: "warranty_stock", label: "Kho Bảo Hành" },
  { value: "rma_staging", label: "Kho RMA" },
  { value: "dead_stock", label: "Kho Hỏng" },
  { value: "in_service", label: "Đang Sử Dụng" },
  { value: "parts", label: "Kho Linh Kiện" },
];

interface ProductItem {
  productId: string;
  quantity: number;
}

export default function CreateIssuePage() {
  const router = useRouter();
  const [issueType, setIssueType] = useState("");
  const [virtualWarehouseType, setVirtualWarehouseType] = useState("");
  const [issueDate, setIssueDate] = useState(new Date().toISOString().split("T")[0]);
  const [notes, setNotes] = useState("");
  const [items, setItems] = useState<ProductItem[]>([]);

  const createIssue = trpc.inventory.issues.create.useMutation();
  const { data: products } = trpc.products.getProducts.useQuery();

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
    if (!issueType || !virtualWarehouseType || items.length === 0) {
      toast.error("Vui lòng điền đầy đủ thông tin");
      return;
    }

    const invalidItems = items.filter((item) => !item.productId || item.quantity <= 0);
    if (invalidItems.length > 0) {
      toast.error("Vui lòng chọn sản phẩm và số lượng hợp lệ cho tất cả dòng");
      return;
    }

    try {
      const issue = await createIssue.mutateAsync({
        issueType: issueType as any,
        virtualWarehouseType,
        issueDate,
        notes: notes || undefined,
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
                    <div className="grid gap-2">
                      <Label>Loại phiếu *</Label>
                      <Select value={issueType} onValueChange={setIssueType}>
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
                      <Select value={virtualWarehouseType} onValueChange={setVirtualWarehouseType}>
                        <SelectTrigger>
                          <SelectValue placeholder="Chọn kho" />
                        </SelectTrigger>
                        <SelectContent>
                          {WAREHOUSE_TYPES.map((wh) => (
                            <SelectItem key={wh.value} value={wh.value}>
                              {wh.label}
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
                              min="1"
                              value={item.quantity}
                              onChange={(e) => handleItemChange(index, "quantity", Number.parseInt(e.target.value))}
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
