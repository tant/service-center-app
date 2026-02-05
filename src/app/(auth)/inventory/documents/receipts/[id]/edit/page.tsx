"use client";

/**
 * Edit Receipt Page
 * Form for editing draft stock receipts
 */

import { AlertCircle, ArrowLeft, Plus, Save, Trash2 } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { use, useEffect, useState } from "react";
import { toast } from "sonner";
import { PageHeader } from "@/components/page-header";
import { trpc } from "@/components/providers/trpc-provider";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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

const RECEIPT_TYPES = [
  { value: "normal", label: "Phiếu nhập bình thường" },
  { value: "adjustment", label: "Phiếu điều chỉnh (kiểm kê)" },
];

interface ProductItem {
  id?: string;
  productId: string;
  declaredQuantity: number;
}

interface EditReceiptPageProps {
  params: Promise<{ id: string }>;
}

export default function EditReceiptPage({ params }: EditReceiptPageProps) {
  const router = useRouter();
  const { id } = use(params);

  const [receiptType, setReceiptType] = useState<"normal" | "adjustment">(
    "normal",
  );
  const [virtualWarehouseId, setVirtualWarehouseId] = useState("");
  const [receiptDate, setReceiptDate] = useState(
    new Date().toISOString().split("T")[0],
  );
  const [notes, setNotes] = useState("");
  const [referenceDocumentNumber, setReferenceDocumentNumber] = useState("");
  const [items, setItems] = useState<ProductItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const { data: receipt, isLoading: receiptLoading } =
    trpc.inventory.receipts.getById.useQuery({ id });
  const updateReceipt = trpc.inventory.receipts.updateFull.useMutation();
  const { data: products } = trpc.products.getProducts.useQuery();
  const { data: virtualWarehouses } =
    trpc.warehouse.listVirtualWarehouses.useQuery();

  // Redirect immediately - editing is no longer supported
  useEffect(() => {
    if (receipt && !receiptLoading) {
      toast.error("Phiếu nhập đã hoàn tất, không thể chỉnh sửa");
      router.push(`/inventory/documents/receipts/${id}`);
    }
  }, [receipt, receiptLoading, router, id]);

  // This code will not run due to redirect, but kept for TypeScript
  useEffect(() => {
    if (receipt && !receiptLoading) {
      setReceiptType(receipt.receipt_type as "normal" | "adjustment");
      setVirtualWarehouseId(receipt.virtual_warehouse_id || "");
      setReceiptDate(
        receipt.receipt_date?.split("T")[0] ||
          new Date().toISOString().split("T")[0],
      );
      setNotes(receipt.notes || "");
      setReferenceDocumentNumber(receipt.reference_document_number || "");

      // Load items
      if (receipt.items && Array.isArray(receipt.items)) {
        setItems(
          receipt.items.map((item: any) => ({
            id: item.id,
            productId: item.product_id,
            declaredQuantity: item.declared_quantity,
          })),
        );
      }

      setIsLoading(false);
    }
  }, [receipt, receiptLoading, router, id]);

  const handleAddItem = () => {
    setItems([...items, { productId: "", declaredQuantity: 1 }]);
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

  const handleSubmit = async () => {
    if (!receiptType || !virtualWarehouseId || items.length === 0) {
      toast.error("Vui lòng điền đầy đủ thông tin");
      return;
    }

    // Validate based on type
    if (receiptType === "normal") {
      const invalidItems = items.filter(
        (item) => !item.productId || item.declaredQuantity <= 0,
      );
      if (invalidItems.length > 0) {
        toast.error("Phiếu nhập bình thường phải có số lượng dương");
        return;
      }
    } else {
      // Adjustment: allow negative but not zero
      const invalidItems = items.filter(
        (item) => !item.productId || item.declaredQuantity === 0,
      );
      if (invalidItems.length > 0) {
        toast.error("Số lượng không được bằng 0");
        return;
      }
    }

    try {
      await updateReceipt.mutateAsync({
        id,
        receiptType,
        virtualWarehouseId,
        receiptDate,
        notes: notes || undefined,
        referenceDocumentNumber: referenceDocumentNumber || undefined,
        items: items.map((item) => ({
          id: item.id,
          productId: item.productId,
          declaredQuantity: item.declaredQuantity,
        })),
      });

      toast.success("Đã cập nhật phiếu nhập thành công");
      router.push(`/inventory/documents/receipts/${id}`);
    } catch (error: any) {
      toast.error(error.message || "Không thể cập nhật phiếu nhập");
    }
  };

  if (receiptLoading || isLoading) {
    return (
      <>
        <PageHeader title="Chỉnh sửa phiếu nhập" />
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

  if (!receipt) {
    return (
      <>
        <PageHeader title="Chỉnh sửa phiếu nhập" />
        <div className="flex flex-1 flex-col">
          <div className="@container/main flex flex-1 flex-col gap-2">
            <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6">
              <div className="px-4 lg:px-6">
                <div className="text-center py-8 text-muted-foreground">
                  Không tìm thấy phiếu nhập
                </div>
              </div>
            </div>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <PageHeader
        title={`Chỉnh sửa phiếu nhập ${receipt.receipt_number || ""}`}
      />
      <div className="flex flex-1 flex-col">
        <div className="@container/main flex flex-1 flex-col gap-2">
          <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6">
            {/* Back Button */}
            <div className="px-4 lg:px-6">
              <Link href={`/inventory/documents/receipts/${id}`}>
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
                      <Select
                        value={receiptType}
                        onValueChange={(v) =>
                          setReceiptType(v as "normal" | "adjustment")
                        }
                      >
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
                      <Select
                        value={virtualWarehouseId}
                        onValueChange={setVirtualWarehouseId}
                      >
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
                      <Input
                        type="date"
                        value={receiptDate}
                        onChange={(e) => setReceiptDate(e.target.value)}
                      />
                    </div>

                    <div className="grid gap-2">
                      <Label>Số chứng từ tham chiếu</Label>
                      <Input
                        placeholder="VD: PO-2024-001"
                        value={referenceDocumentNumber}
                        onChange={(e) =>
                          setReferenceDocumentNumber(e.target.value)
                        }
                      />
                    </div>
                  </div>

                  {receiptType === "adjustment" && (
                    <Alert>
                      <AlertCircle className="h-4 w-4" />
                      <AlertDescription>
                        <strong>Phiếu điều chỉnh:</strong> Số dương = tăng
                        stock, số âm = giảm stock. Dùng khi kiểm kê hoặc sửa sai
                        sót.
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
                              min={
                                receiptType === "adjustment" ? undefined : "1"
                              }
                              value={item.declaredQuantity}
                              onChange={(e) =>
                                handleItemChange(
                                  index,
                                  "declaredQuantity",
                                  Number.parseInt(e.target.value),
                                )
                              }
                              className={
                                item.declaredQuantity < 0
                                  ? "text-red-600 font-medium"
                                  : ""
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

              {/* Warning about serials */}
              {receipt.items?.some(
                (item: any) => item.serials && item.serials.length > 0,
              ) && (
                <div className="rounded-md border border-yellow-300 bg-yellow-50 dark:bg-yellow-900/30 dark:border-yellow-700 p-4">
                  <div className="text-sm text-yellow-800 dark:text-yellow-300">
                    <strong>Lưu ý:</strong> Phiếu nhập này đã có một số serial
                    được nhập. Nếu bạn thay đổi sản phẩm hoặc số lượng, các
                    serial đã nhập có thể bị xóa.
                  </div>
                </div>
              )}

              {/* Submit */}
              <div className="flex justify-end gap-2">
                <Link href={`/inventory/documents/receipts/${id}`}>
                  <Button variant="outline">Hủy</Button>
                </Link>
                <Button
                  onClick={handleSubmit}
                  disabled={updateReceipt.isPending}
                >
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
