/**
 * Service Request Form Component
 * Reusable form for creating/editing service requests
 * Following UI_CODING_GUIDE.md Section 7 - Dedicated Add/Edit Pages
 */

"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { IconLoader2, IconPlus, IconUser, IconPackage, IconTruck } from "@tabler/icons-react";
import { toast } from "sonner";
import { ProductSerialInput } from "./service-request/product-serial-input";

interface ProductItem {
  serial_number: string;
  issue_description?: string;
}

interface ServiceRequestFormData {
  customer_name: string;
  customer_email: string;
  customer_phone: string;
  issue_description: string;
  items: ProductItem[];
  receipt_status: "received" | "pending_receipt";
  preferred_delivery_method?: "pickup" | "delivery";
  delivery_address?: string;
}

interface ServiceRequestFormProps {
  initialData?: Partial<ServiceRequestFormData>;
  mode: "create" | "edit";
  onSubmit: (data: ServiceRequestFormData) => void;
  isSubmitting: boolean;
}

export function ServiceRequestForm({
  initialData,
  mode,
  onSubmit,
  isSubmitting,
}: ServiceRequestFormProps) {
  // Form state
  const [customerName, setCustomerName] = useState(initialData?.customer_name || "");
  const [customerEmail, setCustomerEmail] = useState(initialData?.customer_email || "");
  const [customerPhone, setCustomerPhone] = useState(initialData?.customer_phone || "");
  const [issueDescription, setIssueDescription] = useState(initialData?.issue_description || "");
  const [receiptStatus, setReceiptStatus] = useState<"received" | "pending_receipt">(
    initialData?.receipt_status || "received"
  );
  const [deliveryMethod, setDeliveryMethod] = useState<"pickup" | "delivery" | undefined>(
    initialData?.preferred_delivery_method
  );
  const [deliveryAddress, setDeliveryAddress] = useState(initialData?.delivery_address || "");
  const [items, setItems] = useState<ProductItem[]>(
    initialData?.items || [{ serial_number: "" }]
  );

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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

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
      toast.error("Địa chỉ giao hàng là bắt buộc khi chọn giao hàng tận nơi");
      return;
    }

    onSubmit({
      customer_name: customerName,
      customer_email: customerEmail,
      customer_phone: customerPhone,
      issue_description: issueDescription,
      items: items.map((item) => ({
        serial_number: item.serial_number.toUpperCase(),
        issue_description: item.issue_description,
      })),
      receipt_status: receiptStatus,
      preferred_delivery_method: deliveryMethod,
      delivery_address: deliveryMethod === "delivery" ? deliveryAddress : undefined,
    });
  };

  return (
    <form id="service-request-form" onSubmit={handleSubmit} className="space-y-6">
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
              disabled={items.length >= 10 || isSubmitting}
            >
              <IconPlus className="h-4 w-4 mr-1" />
              Thêm sản phẩm
            </Button>
          </CardTitle>
          <CardDescription>Thêm serial number của các sản phẩm cần sửa chữa</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {items.map((item, index) => (
            <ProductSerialInput
              key={index}
              index={index}
              serial={item.serial_number}
              onSerialChange={(serial) => handleUpdateItem(index, "serial_number", serial)}
              onRemove={() => handleRemoveItem(index)}
              canRemove={items.length > 1}
              disabled={isSubmitting}
              totalProducts={items.length}
            />
          ))}
        </CardContent>
      </Card>

      {/* Issue Description */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Mô tả chung vấn đề</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <Textarea
            id="issue-description"
            value={issueDescription}
            onChange={(e) => setIssueDescription(e.target.value)}
            placeholder="Mô tả chung về vấn đề của các sản phẩm... (tối thiểu 20 ký tự)"
            rows={3}
            disabled={isSubmitting}
          />
          <p className="text-xs text-muted-foreground">{issueDescription.length}/20 ký tự</p>
        </CardContent>
      </Card>

      {/* Customer Information */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm flex items-center gap-2">
            <IconUser className="h-4 w-4" />
            Thông tin khách hàng
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="customer-name">Họ tên *</Label>
              <Input
                id="customer-name"
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
                placeholder="Nguyễn Văn A"
                disabled={isSubmitting}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="customer-phone">Số điện thoại *</Label>
              <Input
                id="customer-phone"
                value={customerPhone}
                onChange={(e) => setCustomerPhone(e.target.value)}
                placeholder="0912345678"
                disabled={isSubmitting}
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
              disabled={isSubmitting}
            />
          </div>
        </CardContent>
      </Card>

      {/* Receipt Status */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Tình trạng nhận hàng</CardTitle>
          <CardDescription>
            Đánh dấu nếu đã nhận sản phẩm từ khách hàng. Bỏ chọn nếu khách sẽ gửi sau.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center space-x-2">
            <Checkbox
              id="receipt-status"
              checked={receiptStatus === "received"}
              onCheckedChange={(checked) =>
                setReceiptStatus(checked ? "received" : "pending_receipt")
              }
              disabled={isSubmitting}
            />
            <Label
              htmlFor="receipt-status"
              className="text-sm font-normal cursor-pointer"
            >
              Đã nhận sản phẩm từ khách hàng
            </Label>
          </div>
          {receiptStatus === "pending_receipt" && (
            <p className="text-xs text-muted-foreground mt-3 p-3 bg-muted rounded-md">
              💡 Phiếu sửa chữa sẽ được tạo tự động khi đánh dấu đã nhận sản phẩm
            </p>
          )}
        </CardContent>
      </Card>

      {/* Delivery Method - Optional */}
      <Accordion type="single" collapsible className="w-full">
        <AccordionItem value="delivery" className="border rounded-lg px-4">
          <AccordionTrigger className="hover:no-underline py-4">
            <div className="flex items-center gap-2 text-sm font-semibold">
              <IconTruck className="h-4 w-4" />
              Thông tin giao hàng (tùy chọn)
            </div>
          </AccordionTrigger>
          <AccordionContent className="pb-4 pt-2">
            <div className="space-y-4">
              <p className="text-xs text-muted-foreground">
                Có thể cập nhật sau khi sản phẩm được sửa chữa xong
              </p>
              <RadioGroup
                value={deliveryMethod}
                onValueChange={(value: any) => setDeliveryMethod(value)}
                disabled={isSubmitting}
              >
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="pickup" id="pickup" />
                  <Label htmlFor="pickup">Tự đến lấy</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="delivery" id="delivery" />
                  <Label htmlFor="delivery">Giao hàng tận nơi</Label>
                </div>
              </RadioGroup>

              {deliveryMethod === "delivery" && (
                <div className="space-y-2">
                  <Label htmlFor="delivery-address">Địa chỉ giao hàng *</Label>
                  <Textarea
                    id="delivery-address"
                    value={deliveryAddress}
                    onChange={(e) => setDeliveryAddress(e.target.value)}
                    placeholder="123 Đường ABC, Phường XYZ, Quận 1, TP.HCM"
                    rows={2}
                    disabled={isSubmitting}
                  />
                </div>
              )}
            </div>
          </AccordionContent>
        </AccordionItem>
      </Accordion>
    </form>
  );
}
