"use client";

/**
 * Create Receipt Page - REDESIGNED
 * Form for creating new stock receipt (simplified types + virtual warehouse IDs)
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
import { ArrowLeft, Plus, Trash2, Save, AlertCircle } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import Link from "next/link";
import { toast } from "sonner";

// REDESIGNED: Only 2 receipt types
const RECEIPT_TYPES = [
  { value: "normal", label: "Phiếu nhập bình thường" },
  { value: "adjustment", label: "Phiếu điều chỉnh (kiểm kê)" },
];

interface ProductItem {
  productId: string;
  declaredQuantity: number;
}

export default function CreateReceiptPage() {
  const router = useRouter();
  const [receiptType, setReceiptType] = useState<"normal" | "adjustment">("normal"); // REDESIGNED
  const [virtualWarehouseId, setVirtualWarehouseId] = useState(""); // REDESIGNED: Use warehouse ID
  const [receiptDate, setReceiptDate] = useState(new Date().toISOString().split("T")[0]);
  const [notes, setNotes] = useState("");
  const [items, setItems] = useState<ProductItem[]>([]);

  const createReceipt = trpc.inventory.receipts.create.useMutation();
  const { data: products } = trpc.products.getProducts.useQuery();
  const { data: virtualWarehouses } = trpc.warehouse.listVirtualWarehouses.useQuery(); // REDESIGNED: Fetch warehouses

  const handleAddItem = () => {
    setItems([...items, { productId: "", declaredQuantity: 1 }]);
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
    if (!receiptType || !virtualWarehouseId || items.length === 0) {
      toast.error("Vui lòng điền đầy đủ thông tin");
      return;
    }

    // REDESIGNED: Validate based on type
    if (receiptType === "normal") {
      const invalidItems = items.filter((item) => !item.productId || item.declaredQuantity <= 0);
      if (invalidItems.length > 0) {
        toast.error("Phiếu nhập bình thường phải có số lượng dương");
        return;
      }
    } else {
      // Adjustment: allow negative but not zero
      const invalidItems = items.filter((item) => !item.productId || item.declaredQuantity === 0);
      if (invalidItems.length > 0) {
        toast.error("Số lượng không được bằng 0");
        return;
      }
    }

    try {
      const receipt = await createReceipt.mutateAsync({
        receiptType,
        virtualWarehouseId, // REDESIGNED: Use warehouse ID
        receiptDate,
        notes: notes || undefined,
        items: items.map((item) => ({
          productId: item.productId,
          declaredQuantity: item.declaredQuantity,
        })),
      });

      toast.success("Đã tạo phiếu nhập thành công");
      router.push(`/inventory/documents/receipts/${receipt.id}`);
    } catch (error: any) {
      toast.error(error.message || "Không thể tạo phiếu nhập");
    }
  };

  return (
    <>
      <PageHeader title="Tạo phiếu nhập kho" />
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
                  <CardTitle>Thông tin phiếu nhập</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="grid gap-2">
                      <Label>Loại phiếu *</Label>
                      <Select value={receiptType} onValueChange={(v) => setReceiptType(v as "normal" | "adjustment")}>
                        <SelectTrigger>
                          <SelectValue placeholder="Chọn loại phiếu" />
                        </SelectTrigger>
                        <SelectContent>
                          {RECEIPT_TYPES.map((type) => (
                            <SelectItem key={type.value} value={type.value}>
                              {type.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="grid gap-2">
                      <Label>Kho nhập *</Label>
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
                      <Label>Ngày nhập *</Label>
                      <Input type="date" value={receiptDate} onChange={(e) => setReceiptDate(e.target.value)} />
                    </div>
                  </div>

                  {/* REDESIGNED: Show alert for adjustment type */}
                  {receiptType === "adjustment" && (
                    <Alert>
                      <AlertCircle className="h-4 w-4" />
                      <AlertDescription>
                        <strong>Phiếu điều chỉnh:</strong> Số dương = tăng stock, số âm = giảm stock. Dùng khi kiểm kê hoặc sửa sai sót.
                      </AlertDescription>
                    </Alert>
                  )}

                  <div className="grid gap-2">
                    <Label>Ghi chú</Label>
                    <Textarea
                      placeholder="Ghi chú về phiếu nhập..."
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
                              min={receiptType === "adjustment" ? undefined : "1"} // REDESIGNED: Allow negative for adjustments
                              value={item.declaredQuantity}
                              onChange={(e) => handleItemChange(index, "declaredQuantity", e.target.value === "" ? 0 : Number.parseInt(e.target.value))}
                              className={item.declaredQuantity < 0 ? "text-red-600 font-medium" : ""}
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
                <Button onClick={handleSubmit} disabled={createReceipt.isPending}>
                  <Save className="h-4 w-4" />
                  Tạo phiếu nhập
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
