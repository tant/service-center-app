"use client";

/**
 * Create Transfer Page - REDESIGNED
 * Form for creating new stock transfer (using virtual warehouse IDs)
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
import { ArrowLeft, Plus, Trash2, Save, ArrowRight, Ban } from "lucide-react";
import Link from "next/link";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { toast } from "sonner";

interface ProductItem {
  productId: string;
  quantity: number;
}

export default function CreateTransferPage() {
  const router = useRouter();
  const [fromWarehouseId, setFromWarehouseId] = useState(""); // REDESIGNED: Use warehouse ID
  const [toWarehouseId, setToWarehouseId] = useState(""); // REDESIGNED: Use warehouse ID
  const [transferDate, setTransferDate] = useState(new Date().toISOString().split("T")[0]);
  const [notes, setNotes] = useState("");
  const [items, setItems] = useState<ProductItem[]>([]);

  const createTransfer = trpc.inventory.transfers.create.useMutation();
  const { data: products } = trpc.products.getProducts.useQuery();
  const { data: virtualWarehouses } = trpc.warehouse.listVirtualWarehouses.useQuery();

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
    if (!fromWarehouseId || !toWarehouseId || items.length === 0) {
      toast.error("Vui lòng điền đầy đủ thông tin");
      return;
    }

    if (fromWarehouseId === toWarehouseId) {
      toast.error("Kho nguồn và kho đích không được giống nhau");
      return;
    }

    const invalidItems = items.filter((item) => !item.productId || item.quantity <= 0);
    if (invalidItems.length > 0) {
      toast.error("Vui lòng chọn sản phẩm và số lượng hợp lệ cho tất cả dòng");
      return;
    }

    try {
      const transfer = await createTransfer.mutateAsync({
        fromVirtualWarehouseId: fromWarehouseId,
        toVirtualWarehouseId: toWarehouseId,
        transferDate,
        notes: notes || undefined,
        items: items.map((item) => ({
          productId: item.productId,
          quantity: item.quantity,
        })),
      });

      toast.success("Đã tạo phiếu chuyển thành công");
      router.push(`/inventory/documents/transfers/${transfer.id}`);
    } catch (error: any) {
      toast.error(error.message || "Không thể tạo phiếu chuyển");
    }
  };

  return (
    <>
      <PageHeader title="Tạo phiếu chuyển kho" />
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
                  <CardTitle>Thông tin phiếu chuyển</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="grid gap-2">
                      <Label>Từ kho *</Label>
                      <Select value={fromWarehouseId} onValueChange={setFromWarehouseId}>
                        <SelectTrigger>
                          <SelectValue placeholder="Chọn kho nguồn" />
                        </SelectTrigger>
                        <SelectContent>
                          {virtualWarehouses?.map((wh) => {
                            const isCustomerInstalled = wh.warehouse_type === "customer_installed";
                            if (isCustomerInstalled) {
                              return (
                                <TooltipProvider key={wh.id}>
                                  <Tooltip>
                                    <TooltipTrigger asChild>
                                      <div className="flex items-center gap-2 px-2 py-1.5 text-sm text-muted-foreground cursor-not-allowed">
                                        <Ban className="h-4 w-4" />
                                        {wh.name}
                                      </div>
                                    </TooltipTrigger>
                                    <TooltipContent side="right" className="max-w-xs">
                                      <p className="font-medium">Không thể chuyển kho từ "Hàng Đã Bán"</p>
                                      <p className="text-xs text-muted-foreground mt-1">
                                        Hàng đã giao cho khách. Nếu khách trả lại, vui lòng sử dụng Phiếu nhập kho.
                                      </p>
                                      <Link href="/inventory/documents/receipts/new" className="text-xs text-primary hover:underline mt-1 block">
                                        → Tạo phiếu nhập kho
                                      </Link>
                                    </TooltipContent>
                                  </Tooltip>
                                </TooltipProvider>
                              );
                            }
                            return (
                              <SelectItem key={wh.id} value={wh.id}>
                                {wh.name}
                              </SelectItem>
                            );
                          })}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="grid gap-2">
                      <Label>Đến kho *</Label>
                      <Select value={toWarehouseId} onValueChange={setToWarehouseId}>
                        <SelectTrigger>
                          <SelectValue placeholder="Chọn kho đích" />
                        </SelectTrigger>
                        <SelectContent>
                          {virtualWarehouses?.map((wh) => {
                            const isCustomerInstalled = wh.warehouse_type === "customer_installed";
                            if (isCustomerInstalled) {
                              return (
                                <TooltipProvider key={wh.id}>
                                  <Tooltip>
                                    <TooltipTrigger asChild>
                                      <div className="flex items-center gap-2 px-2 py-1.5 text-sm text-muted-foreground cursor-not-allowed">
                                        <Ban className="h-4 w-4" />
                                        {wh.name}
                                      </div>
                                    </TooltipTrigger>
                                    <TooltipContent side="right" className="max-w-xs">
                                      <p className="font-medium">Không thể chuyển kho vào "Hàng Đã Bán"</p>
                                      <p className="text-xs text-muted-foreground mt-1">
                                        Để xuất hàng cho khách, vui lòng sử dụng Phiếu xuất kho với lý do "Bán hàng" hoặc "Đổi bảo hành".
                                      </p>
                                      <Link href="/inventory/documents/issues/new" className="text-xs text-primary hover:underline mt-1 block">
                                        → Tạo phiếu xuất kho
                                      </Link>
                                    </TooltipContent>
                                  </Tooltip>
                                </TooltipProvider>
                              );
                            }
                            return (
                              <SelectItem key={wh.id} value={wh.id}>
                                {wh.name}
                              </SelectItem>
                            );
                          })}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="grid gap-2">
                      <Label>Ngày chuyển *</Label>
                      <Input type="date" value={transferDate} onChange={(e) => setTransferDate(e.target.value)} />
                    </div>
                  </div>

                  {fromWarehouseId && toWarehouseId && (
                    <div className="rounded-md bg-muted p-4 flex items-center gap-2">
                      <span className="text-sm font-medium">
                        {virtualWarehouses?.find((w) => w.id === fromWarehouseId)?.name}
                      </span>
                      <ArrowRight className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm font-medium">
                        {virtualWarehouses?.find((w) => w.id === toWarehouseId)?.name}
                      </span>
                    </div>
                  )}

                  <div className="grid gap-2">
                    <Label>Ghi chú</Label>
                    <Textarea
                      placeholder="Ghi chú về phiếu chuyển..."
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
                              onChange={(e) => {
                              const val = Number.parseInt(e.target.value);
                              handleItemChange(index, "quantity", Number.isNaN(val) ? 0 : val);
                            }}
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
                <Button onClick={handleSubmit} disabled={createTransfer.isPending}>
                  <Save className="h-4 w-4" />
                  Tạo phiếu chuyển
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
