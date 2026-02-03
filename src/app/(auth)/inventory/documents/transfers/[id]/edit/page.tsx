"use client";

/**
 * Edit Transfer Page
 * Form for editing draft stock transfers
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
import { ArrowLeft, Plus, Trash2, Save, ArrowRight } from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";

interface ProductItem {
  id?: string; // Existing item ID for updates
  productId: string;
  quantity: number;
}

interface EditTransferPageProps {
  params: Promise<{ id: string }>;
}

export default function EditTransferPage({ params }: EditTransferPageProps) {
  const router = useRouter();
  const { id } = use(params);

  const [fromWarehouseId, setFromWarehouseId] = useState("");
  const [toWarehouseId, setToWarehouseId] = useState("");
  const [transferDate, setTransferDate] = useState(new Date().toISOString().split("T")[0]);
  const [notes, setNotes] = useState("");
  const [customerId, setCustomerId] = useState("");
  const [items, setItems] = useState<ProductItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const { data: transfer, isLoading: transferLoading } = trpc.inventory.transfers.getById.useQuery({ id });
  const updateTransfer = trpc.inventory.transfers.updateFull.useMutation();
  const { data: products } = trpc.products.getProducts.useQuery();
  const { data: virtualWarehouses } = trpc.warehouse.listVirtualWarehouses.useQuery();
  const { data: customers } = trpc.customers.getCustomers.useQuery();

  // Redirect immediately - editing is no longer supported
  useEffect(() => {
    if (transfer && !transferLoading) {
      toast.error("Phiếu chuyển đã hoàn tất, không thể chỉnh sửa");
      router.push(`/inventory/documents/transfers/${id}`);
    }
  }, [transfer, transferLoading, router, id]);

  // This code will not run due to redirect, but kept for TypeScript
  useEffect(() => {
    if (transfer && !transferLoading) {
      setFromWarehouseId(transfer.from_virtual_warehouse_id || "");
      setToWarehouseId(transfer.to_virtual_warehouse_id || "");
      setTransferDate(transfer.transfer_date?.split("T")[0] || new Date().toISOString().split("T")[0]);
      setNotes(transfer.notes || "");
      setCustomerId(transfer.customer_id || "");

      // Load items
      if (transfer.items && Array.isArray(transfer.items)) {
        setItems(
          transfer.items.map((item: any) => ({
            id: item.id,
            productId: item.product_id,
            quantity: item.quantity,
          }))
        );
      }

      setIsLoading(false);
    }
  }, [transfer, transferLoading, router, id]);

  // Check if destination warehouse is customer_installed
  const toWarehouse = virtualWarehouses?.find((w) => w.id === toWarehouseId);
  const isCustomerInstalled = toWarehouse?.warehouse_type === "customer_installed";

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

    // Validate customer selection for customer_installed transfers
    if (isCustomerInstalled && !customerId) {
      toast.error("Vui lòng chọn khách hàng khi chuyển đến kho Hàng Đã Bán");
      return;
    }

    const invalidItems = items.filter((item) => !item.productId || item.quantity <= 0);
    if (invalidItems.length > 0) {
      toast.error("Vui lòng chọn sản phẩm và số lượng hợp lệ cho tất cả dòng");
      return;
    }

    try {
      await updateTransfer.mutateAsync({
        id,
        fromVirtualWarehouseId: fromWarehouseId,
        toVirtualWarehouseId: toWarehouseId,
        transferDate,
        notes: notes || undefined,
        customerId: customerId || undefined,
        items: items.map((item) => ({
          id: item.id,
          productId: item.productId,
          quantity: item.quantity,
        })),
      });

      toast.success("Đã cập nhật phiếu chuyển thành công");
      router.push(`/inventory/documents/transfers/${id}`);
    } catch (error: any) {
      toast.error(error.message || "Không thể cập nhật phiếu chuyển");
    }
  };

  if (transferLoading || isLoading) {
    return (
      <>
        <PageHeader title="Chỉnh sửa phiếu chuyển" />
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

  if (!transfer) {
    return (
      <>
        <PageHeader title="Chỉnh sửa phiếu chuyển" />
        <div className="flex flex-1 flex-col">
          <div className="@container/main flex flex-1 flex-col gap-2">
            <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6">
              <div className="px-4 lg:px-6">
                <div className="text-center py-8 text-muted-foreground">Không tìm thấy phiếu chuyển</div>
              </div>
            </div>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <PageHeader title={`Chỉnh sửa phiếu chuyển ${transfer.transfer_number || ""}`} />
      <div className="flex flex-1 flex-col">
        <div className="@container/main flex flex-1 flex-col gap-2">
          <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6">
            {/* Back Button */}
            <div className="px-4 lg:px-6">
              <Link href={`/inventory/documents/transfers/${id}`}>
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
                          {virtualWarehouses?.map((wh) => (
                            <SelectItem key={wh.id} value={wh.id}>
                              {wh.name}
                            </SelectItem>
                          ))}
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
                          {virtualWarehouses?.map((wh) => (
                            <SelectItem key={wh.id} value={wh.id}>
                              {wh.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    {/* Customer selection - shown only for customer_installed transfers */}
                    {isCustomerInstalled && (
                      <div className="grid gap-2 md:col-span-2">
                        <Label className="text-primary">Khách hàng nhận hàng *</Label>
                        <Select value={customerId} onValueChange={setCustomerId}>
                          <SelectTrigger className="border-primary">
                            <SelectValue placeholder="Chọn khách hàng..." />
                          </SelectTrigger>
                          <SelectContent>
                            {customers?.map((customer) => (
                              <SelectItem key={customer.id} value={customer.id}>
                                {customer.name} {customer.phone && `- ${customer.phone}`}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <p className="text-xs text-muted-foreground">
                          Hệ thống sẽ tự động cập nhật thông tin khách hàng cho các sản phẩm được chuyển
                        </p>
                      </div>
                    )}

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

              {/* Warning about serials */}
              {transfer.items?.some((item: any) => item.serials && item.serials.length > 0) && (
                <div className="rounded-md border border-yellow-300 bg-yellow-50 dark:bg-yellow-900/30 dark:border-yellow-700 p-4">
                  <div className="text-sm text-yellow-800 dark:text-yellow-300">
                    <strong>Lưu ý:</strong> Phiếu chuyển này đã có một số serial được chọn. Nếu bạn thay đổi sản phẩm hoặc số lượng, các serial đã chọn có thể bị xóa.
                  </div>
                </div>
              )}

              {/* Submit */}
              <div className="flex justify-end gap-2">
                <Link href={`/inventory/documents/transfers/${id}`}>
                  <Button variant="outline">Hủy</Button>
                </Link>
                <Button onClick={handleSubmit} disabled={updateTransfer.isPending}>
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
