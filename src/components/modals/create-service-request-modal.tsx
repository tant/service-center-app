/**
 * Create Service Request Modal (Staff)
 * Staff can create service requests on behalf of customers
 * Updated 2025-10-29: Support multiple products per request
 */

"use client";

import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { IconLoader2, IconPlus, IconTrash, IconUser, IconPackage } from "@tabler/icons-react";
import { toast } from "sonner";
import { trpc } from "@/components/providers/trpc-provider";

interface CreateServiceRequestModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

interface ProductItem {
  serial_number: string;
  issue_description?: string;
}

export function CreateServiceRequestModal({ open, onOpenChange }: CreateServiceRequestModalProps) {
  const utils = trpc.useUtils();

  // Customer info
  const [customerName, setCustomerName] = useState("");
  const [customerEmail, setCustomerEmail] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");

  // Request info
  const [issueDescription, setIssueDescription] = useState("");
  const [serviceType, setServiceType] = useState<"warranty" | "paid" | "replacement">("warranty");
  const [deliveryMethod, setDeliveryMethod] = useState<"pickup" | "delivery">("pickup");
  const [deliveryAddress, setDeliveryAddress] = useState("");

  // Products
  const [items, setItems] = useState<ProductItem[]>([{ serial_number: "" }]);

  const createRequest = trpc.serviceRequest.submit.useMutation({
    onSuccess: (data) => {
      toast.success(`Đã tạo phiếu yêu cầu ${data.tracking_token} với ${data.item_count} sản phẩm`);
      handleReset();
      onOpenChange(false);
      utils.serviceRequest.listPending.invalidate();
    },
    onError: (error: any) => {
      toast.error(`Lỗi: ${error.message}`);
    },
  });

  const handleAddItem = () => {
    if (items.length >= 10) {
      toast.error("Tối đa 10 sản phẩm mỗi phiếu yêu cầu");
      return;
    }
    setItems([...items, { serial_number: "" }]);
  };

  const handleRemoveItem = (index: number) => {
    if (items.length === 1) {
      toast.error("Phải có ít nhất 1 sản phẩm");
      return;
    }
    setItems(items.filter((_, i) => i !== index));
  };

  const handleUpdateItem = (index: number, field: keyof ProductItem, value: string) => {
    const newItems = [...items];
    newItems[index] = { ...newItems[index], [field]: value };
    setItems(newItems);
  };

  const handleSubmit = () => {
    // Validation
    if (!customerName || customerName.length < 2) {
      toast.error("Tên khách hàng phải có ít nhất 2 ký tự");
      return;
    }
    if (!customerEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(customerEmail)) {
      toast.error("Email không hợp lệ");
      return;
    }
    if (!customerPhone || customerPhone.length < 10) {
      toast.error("Số điện thoại phải có ít nhất 10 ký tự");
      return;
    }
    if (!issueDescription || issueDescription.length < 20) {
      toast.error("Mô tả vấn đề phải có ít nhất 20 ký tự");
      return;
    }
    if (items.some((item) => !item.serial_number || item.serial_number.length < 5)) {
      toast.error("Tất cả serial number phải có ít nhất 5 ký tự");
      return;
    }
    if (deliveryMethod === "delivery" && !deliveryAddress) {
      toast.error("Địa chỉ giao hàng là bắt buộc");
      return;
    }

    createRequest.mutate({
      customer_name: customerName,
      customer_email: customerEmail,
      customer_phone: customerPhone,
      issue_description: issueDescription,
      items: items.map((item) => ({
        serial_number: item.serial_number.toUpperCase(),
        issue_description: item.issue_description,
      })),
      service_type: serviceType,
      preferred_delivery_method: deliveryMethod,
      delivery_address: deliveryMethod === "delivery" ? deliveryAddress : undefined,
    });
  };

  const handleReset = () => {
    setCustomerName("");
    setCustomerEmail("");
    setCustomerPhone("");
    setIssueDescription("");
    setServiceType("warranty");
    setDeliveryMethod("pickup");
    setDeliveryAddress("");
    setItems([{ serial_number: "" }]);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Tạo phiếu yêu cầu dịch vụ</DialogTitle>
          <DialogDescription>
            Tạo phiếu yêu cầu dịch vụ thay mặt khách hàng. Có thể thêm nhiều sản phẩm trong 1 phiếu.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Customer Information */}
          <Card>
            <CardHeader>
              <CardTitle className="text-sm flex items-center gap-2">
                <IconUser className="h-4 w-4" />
                Thông tin khách hàng
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="customer-name">Họ tên *</Label>
                  <Input
                    id="customer-name"
                    value={customerName}
                    onChange={(e) => setCustomerName(e.target.value)}
                    placeholder="Nguyễn Văn A"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="customer-phone">Số điện thoại *</Label>
                  <Input
                    id="customer-phone"
                    value={customerPhone}
                    onChange={(e) => setCustomerPhone(e.target.value)}
                    placeholder="0912345678"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="customer-email">Email *</Label>
                <Input
                  id="customer-email"
                  type="email"
                  value={customerEmail}
                  onChange={(e) => setCustomerEmail(e.target.value)}
                  placeholder="customer@example.com"
                />
              </div>
            </CardContent>
          </Card>

          {/* Products */}
          <Card>
            <CardHeader>
              <CardTitle className="text-sm flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <IconPackage className="h-4 w-4" />
                  Sản phẩm ({items.length}/10)
                </div>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleAddItem}
                  disabled={items.length >= 10}
                >
                  <IconPlus className="h-4 w-4 mr-1" />
                  Thêm sản phẩm
                </Button>
              </CardTitle>
              <CardDescription>Thêm serial number của các sản phẩm cần sửa chữa</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {items.map((item, index) => (
                <div key={index} className="flex gap-2 items-start p-3 border rounded-lg">
                  <div className="flex-1 space-y-3">
                    <div className="space-y-2">
                      <Label htmlFor={`serial-${index}`}>Serial Number #{index + 1} *</Label>
                      <Input
                        id={`serial-${index}`}
                        value={item.serial_number}
                        onChange={(e) => handleUpdateItem(index, "serial_number", e.target.value)}
                        placeholder="VD: ZT-RTX4090-001234"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor={`issue-${index}`}>Vấn đề cụ thể (tùy chọn)</Label>
                      <Textarea
                        id={`issue-${index}`}
                        value={item.issue_description || ""}
                        onChange={(e) => handleUpdateItem(index, "issue_description", e.target.value)}
                        placeholder="Vấn đề riêng của sản phẩm này..."
                        rows={2}
                      />
                    </div>
                  </div>
                  {items.length > 1 && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={() => handleRemoveItem(index)}
                      className="mt-8"
                    >
                      <IconTrash className="h-4 w-4 text-destructive" />
                    </Button>
                  )}
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Issue Description */}
          <div className="space-y-2">
            <Label htmlFor="issue-description">Mô tả chung vấn đề *</Label>
            <Textarea
              id="issue-description"
              value={issueDescription}
              onChange={(e) => setIssueDescription(e.target.value)}
              placeholder="Mô tả chung về vấn đề của các sản phẩm... (tối thiểu 20 ký tự)"
              rows={3}
            />
            <p className="text-xs text-muted-foreground">{issueDescription.length}/20 ký tự</p>
          </div>

          {/* Service Type */}
          <div className="space-y-2">
            <Label>Loại dịch vụ *</Label>
            <RadioGroup value={serviceType} onValueChange={(value: any) => setServiceType(value)}>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="warranty" id="warranty" />
                <Label htmlFor="warranty">Bảo hành</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="paid" id="paid" />
                <Label htmlFor="paid">Sửa chữa có phí</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="replacement" id="replacement" />
                <Label htmlFor="replacement">Đổi trả bảo hành</Label>
              </div>
            </RadioGroup>
          </div>

          {/* Delivery Method */}
          <div className="space-y-2">
            <Label>Phương thức nhận hàng *</Label>
            <RadioGroup value={deliveryMethod} onValueChange={(value: any) => setDeliveryMethod(value)}>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="pickup" id="pickup" />
                <Label htmlFor="pickup">Tự đến lấy</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="delivery" id="delivery" />
                <Label htmlFor="delivery">Giao hàng tận nơi</Label>
              </div>
            </RadioGroup>
          </div>

          {deliveryMethod === "delivery" && (
            <div className="space-y-2">
              <Label htmlFor="delivery-address">Địa chỉ giao hàng *</Label>
              <Textarea
                id="delivery-address"
                value={deliveryAddress}
                onChange={(e) => setDeliveryAddress(e.target.value)}
                placeholder="123 Đường ABC, Phường XYZ, Quận 1, TP.HCM"
                rows={2}
              />
            </div>
          )}
        </div>

        <div className="flex justify-end gap-2 pt-4 border-t">
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={createRequest.isPending}>
            Hủy
          </Button>
          <Button onClick={handleSubmit} disabled={createRequest.isPending}>
            {createRequest.isPending && <IconLoader2 className="h-4 w-4 mr-2 animate-spin" />}
            Tạo phiếu yêu cầu
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
