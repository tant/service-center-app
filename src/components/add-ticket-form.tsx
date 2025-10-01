"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { z } from "zod";
import {
  IconPhone,
  IconUser,
  IconMail,
  IconMapPin,
  IconSettings,
  IconPackage,
  IconPlus,
  IconTrash,
  IconCalculator,
} from "@tabler/icons-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { SearchableSelect, type SearchableSelectOption } from "@/components/ui/searchable-select";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";
import { trpc } from "@/components/providers/trpc-provider";

// Types
interface SelectedPart {
  id: string;
  name: string;
  price: number;
  quantity: number;
}

interface CustomerData {
  id?: string;
  name: string;
  phone: string;
  email?: string;
  address?: string;
}

export function AddTicketForm() {
  const router = useRouter();
  const [step, setStep] = React.useState(1);
  const [isLoading, setIsLoading] = React.useState(false);

  // Validation errors state
  const [errors, setErrors] = React.useState({
    phone: "",
    name: "",
    description: "",
    product: "",
  });

  // Customer data
  const [customerData, setCustomerData] = React.useState<CustomerData>({
    name: "",
    phone: "",
    email: "",
    address: "",
  });
  const [phoneSearch, setPhoneSearch] = React.useState("");

  // Ticket data
  const [ticketData, setTicketData] = React.useState({
    priority_level: "normal" as "low" | "normal" | "high" | "urgent",
    warranty_type: "paid" as "warranty" | "paid" | "goodwill",
    product_id: "",
    description: "",
    service_fee: 0,
    diagnosis_fee: 0,
    discount_amount: 0,
  });

  const [selectedParts, setSelectedParts] = React.useState<SelectedPart[]>([]);
  const [availableParts, setAvailableParts] = React.useState<any[]>([]);

  // tRPC queries
  const { data: customers } = trpc.customers.getCustomers.useQuery();
  const { data: products } = trpc.products.getProducts.useQuery();
  const { data: productWithParts } = trpc.products.getProduct.useQuery(
    { id: ticketData.product_id },
    { enabled: !!ticketData.product_id }
  );

  // Prepare products options for searchable select
  const productsOptions: SearchableSelectOption[] = React.useMemo(
    () =>
      products?.map((product) => {
        const brandText = product.brand || 'Không có thương hiệu';
        const modelText = product.model ? ` • ${product.model}` : '';
        const skuText = product.sku ? ` • SKU: ${product.sku}` : '';

        return {
          label: product.name,
          value: product.id,
          description: `${brandText} • ${product.type}${modelText}${skuText}`,
          // Add searchable fields
          brand: product.brand,
          model: product.model,
          sku: product.sku,
          type: product.type,
        };
      }) || [],
    [products]
  );

  const createTicketMutation = trpc.tickets.createTicket.useMutation({
    onSuccess: (data) => {
      toast.success("Phiếu dịch vụ đã được tạo thành công!");
      router.push(`/tickets/${data.ticket.id}`);
    },
    onError: (error) => {
      toast.error(error.message || "Có lỗi xảy ra khi tạo phiếu dịch vụ");
    },
  });

  // Search customer by phone
  React.useEffect(() => {
    if (phoneSearch.length >= 3) {
      const foundCustomer = customers?.find(c =>
        c.phone?.includes(phoneSearch) ||
        c.phone?.replace(/\D/g, '').includes(phoneSearch.replace(/\D/g, ''))
      );

      if (foundCustomer) {
        setCustomerData({
          id: foundCustomer.id,
          name: foundCustomer.name || "",
          phone: foundCustomer.phone || "",
          email: foundCustomer.email || "",
          address: foundCustomer.address || "",
        });
      }
    }
  }, [phoneSearch, customers]);

  // Update available parts when product changes
  React.useEffect(() => {
    if (ticketData.product_id) {
      if (productWithParts?.parts && productWithParts.parts.length > 0) {
        setAvailableParts(productWithParts.parts);
        setSelectedParts([]); // Reset selected parts when product changes
      } else if (productWithParts && productWithParts.parts) {
        // Product has no parts configured
        setAvailableParts([]);
        setSelectedParts([]);
      }
    } else {
      // No product selected, clear everything
      setAvailableParts([]);
      setSelectedParts([]);
    }
  }, [productWithParts, ticketData.product_id]);

  const handlePhoneChange = (value: string) => {
    setPhoneSearch(value);
    // Store the original format as database expects it
    setCustomerData(prev => ({ ...prev, phone: value }));
    // Clear error when user starts typing
    if (errors.phone) {
      setErrors(prev => ({ ...prev, phone: "" }));
    }
  };

  const validatePhone = () => {
    if (!customerData.phone) {
      setErrors(prev => ({ ...prev, phone: "Số điện thoại là bắt buộc" }));
      return false;
    }
    if (!isValidPhone(customerData.phone)) {
      setErrors(prev => ({ ...prev, phone: "Số điện thoại cần có ít nhất 10 ký tự và chỉ chứa số, dấu cách, gạch ngang, ngoặc đơn, dấu cộng" }));
      return false;
    }
    setErrors(prev => ({ ...prev, phone: "" }));
    return true;
  };

  const validateName = () => {
    if (!customerData.name.trim()) {
      setErrors(prev => ({ ...prev, name: "Tên khách hàng là bắt buộc" }));
      return false;
    }
    setErrors(prev => ({ ...prev, name: "" }));
    return true;
  };

  const validateDescription = () => {
    if (!ticketData.description.trim()) {
      setErrors(prev => ({ ...prev, description: "Mô tả vấn đề là bắt buộc" }));
      return false;
    }
    setErrors(prev => ({ ...prev, description: "" }));
    return true;
  };

  const validateProduct = () => {
    if (!ticketData.product_id) {
      setErrors(prev => ({ ...prev, product: "Vui lòng chọn sản phẩm cần sửa" }));
      return false;
    }
    setErrors(prev => ({ ...prev, product: "" }));
    return true;
  };

  const handlePartQuantityChange = (partId: string, quantity: number) => {
    setSelectedParts(prev =>
      prev.map(part =>
        part.id === partId
          ? { ...part, quantity: Math.max(0, quantity) }
          : part
      ).filter(part => part.quantity > 0)
    );
  };

  const addPart = (part: any) => {
    setSelectedParts(prev => [...prev, {
      id: part.id,
      name: part.name,
      price: part.price,
      quantity: 1,
    }]);
  };

  const removePart = (partId: string) => {
    setSelectedParts(prev => prev.filter(part => part.id !== partId));
  };

  // Calculate totals
  const partsTotal = selectedParts.reduce((sum, part) => sum + (part.price * part.quantity), 0);
  const subtotal = ticketData.service_fee + ticketData.diagnosis_fee + partsTotal;
  const total = subtotal - ticketData.discount_amount;

  // Phone validation helper - matches database constraints
  const isValidPhone = (phone: string) => {
    if (!phone) return false;
    return phone.length >= 10 && /^[0-9+\-\s()]+$/.test(phone);
  };

  const canProceedToStep2 = customerData.name && customerData.phone && isValidPhone(customerData.phone);
  const canProceedToStep3 = canProceedToStep2 && ticketData.description.trim();
  const canProceedToStep4 = canProceedToStep3 && ticketData.product_id;
  const canSubmit = canProceedToStep4 && ticketData.service_fee >= 0;

  const handleSubmit = async () => {
    if (!canSubmit) {
      toast.error("Vui lòng điền đầy đủ thông tin bắt buộc");
      return;
    }

    setIsLoading(true);
    try {
      await createTicketMutation.mutateAsync({
        customer_data: {
          ...customerData,
          email: customerData.email || null,
        },
        product_id: ticketData.product_id,
        description: ticketData.description,
        priority_level: ticketData.priority_level,
        warranty_type: ticketData.warranty_type,
        service_fee: ticketData.service_fee,
        diagnosis_fee: ticketData.diagnosis_fee,
        discount_amount: ticketData.discount_amount,
        parts: selectedParts.map(part => ({
          part_id: part.id,
          quantity: part.quantity,
          unit_price: part.price,
        })),
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="grid gap-6">
      {/* Progress indicator */}
      <div className="flex items-center justify-center space-x-4">
        {[1, 2, 3, 4].map((stepNum) => (
          <div key={stepNum} className="flex items-center">
            <div
              className={`rounded-full w-8 h-8 flex items-center justify-center text-sm font-medium ${
                step >= stepNum
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted text-muted-foreground"
              }`}
            >
              {stepNum}
            </div>
            {stepNum < 4 && (
              <div
                className={`w-12 h-0.5 mx-2 ${
                  step > stepNum ? "bg-primary" : "bg-muted"
                }`}
              />
            )}
          </div>
        ))}
      </div>

      {/* Bước 1: Thông Tin Khách Hàng */}
      {step === 1 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <IconUser className="h-5 w-5" />
              Thông Tin Khách Hàng
            </CardTitle>
            <CardDescription>
              Nhập số điện thoại để tìm khách hàng hoặc tạo mới
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="phone" className="flex items-center gap-2">
                <IconPhone className="h-4 w-4" />
                Số điện thoại *
              </Label>
              <Input
                id="phone"
                value={phoneSearch}
                onChange={(e) => handlePhoneChange(e.target.value)}
                onBlur={validatePhone}
                placeholder="Nhập số điện thoại (tối thiểu 10 ký tự)"
                type="tel"
                className={errors.phone ? "border-red-500" : ""}
              />
              {errors.phone && (
                <p className="text-sm text-red-500">
                  {errors.phone}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="name" className="flex items-center gap-2">
                <IconUser className="h-4 w-4" />
                Tên khách hàng *
              </Label>
              <Input
                id="name"
                value={customerData.name}
                onChange={(e) => {
                  setCustomerData(prev => ({ ...prev, name: e.target.value }));
                  if (errors.name) {
                    setErrors(prev => ({ ...prev, name: "" }));
                  }
                }}
                onBlur={validateName}
                placeholder="Nhập tên khách hàng"
                className={errors.name ? "border-red-500" : ""}
              />
              {errors.name && (
                <p className="text-sm text-red-500">
                  {errors.name}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="email" className="flex items-center gap-2">
                <IconMail className="h-4 w-4" />
                Email (tùy chọn)
              </Label>
              <Input
                id="email"
                type="email"
                value={customerData.email || ""}
                onChange={(e) => setCustomerData(prev => ({ ...prev, email: e.target.value }))}
                placeholder="Nhập email"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="address" className="flex items-center gap-2">
                <IconMapPin className="h-4 w-4" />
                Địa chỉ (tùy chọn)
              </Label>
              <Textarea
                id="address"
                value={customerData.address || ""}
                onChange={(e) => setCustomerData(prev => ({ ...prev, address: e.target.value }))}
                placeholder="Nhập địa chỉ"
                rows={2}
              />
            </div>

            <div className="flex justify-end">
              <Button
                onClick={() => {
                  const phoneValid = validatePhone();
                  const nameValid = validateName();
                  if (phoneValid && nameValid) {
                    setStep(2);
                  }
                }}
                disabled={!canProceedToStep2}
              >
                Tiếp theo
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Bước 2: Cài Đặt Phiếu Dịch Vụ */}
      {step === 2 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <IconSettings className="h-5 w-5" />
              Cài Đặt Phiếu Dịch Vụ
            </CardTitle>
            <CardDescription>
              Chọn độ ưu tiên và loại bảo hành
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Độ ưu tiên</Label>
                <Select
                  value={ticketData.priority_level}
                  onValueChange={(value: "low" | "normal" | "high" | "urgent") =>
                    setTicketData(prev => ({ ...prev, priority_level: value }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="low">
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full bg-green-500" />
                        Thấp
                      </div>
                    </SelectItem>
                    <SelectItem value="normal">
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full bg-blue-500" />
                        Bình thường
                      </div>
                    </SelectItem>
                    <SelectItem value="high">
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full bg-yellow-500" />
                        Cao
                      </div>
                    </SelectItem>
                    <SelectItem value="urgent">
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full bg-red-500" />
                        Khẩn cấp
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Loại bảo hành</Label>
                <Select
                  value={ticketData.warranty_type}
                  onValueChange={(value: "warranty" | "paid" | "goodwill") =>
                    setTicketData(prev => ({ ...prev, warranty_type: value }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="warranty">Bảo hành</SelectItem>
                    <SelectItem value="paid">Trả phí</SelectItem>
                    <SelectItem value="goodwill">Thiện chí</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Mô tả vấn đề *</Label>
              <Textarea
                id="description"
                value={ticketData.description}
                onChange={(e) => {
                  setTicketData(prev => ({ ...prev, description: e.target.value }));
                  if (errors.description) {
                    setErrors(prev => ({ ...prev, description: "" }));
                  }
                }}
                onBlur={validateDescription}
                placeholder="Mô tả chi tiết vấn đề của sản phẩm..."
                rows={3}
                className={errors.description ? "border-red-500" : ""}
              />
              {errors.description && (
                <p className="text-sm text-red-500">
                  {errors.description}
                </p>
              )}
            </div>

            <div className="flex justify-between">
              <Button variant="outline" onClick={() => setStep(1)}>
                Quay lại
              </Button>
              <Button
                onClick={() => {
                  if (validateDescription()) {
                    setStep(3);
                  }
                }}
                disabled={!canProceedToStep3}
              >
                Tiếp theo
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Bước 3: Sản Phẩm & Linh Kiện */}
      {step === 3 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <IconPackage className="h-5 w-5" />
              Sản Phẩm & Linh Kiện
            </CardTitle>
            <CardDescription>
              Chọn sản phẩm cần sửa và linh kiện sử dụng
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <Label>Sản phẩm cần sửa *</Label>
              <SearchableSelect
                options={productsOptions}
                value={ticketData.product_id}
                onValueChange={(value) => {
                  setTicketData(prev => ({ ...prev, product_id: value }));
                  if (errors.product) {
                    setErrors(prev => ({ ...prev, product: "" }));
                  }
                }}
                placeholder={productsOptions.length > 0
                  ? `Chọn sản phẩm cần sửa... (${productsOptions.length} sản phẩm)`
                  : "Đang tải danh sách sản phẩm..."
                }
                searchPlaceholder="Tìm kiếm theo tên, thương hiệu, loại, model hoặc SKU..."
                emptyMessage="Không tìm thấy sản phẩm phù hợp với từ khóa tìm kiếm."
                renderOption={(option) => (
                  <div className="flex flex-col items-start w-full">
                    <span className="font-medium">{option.label}</span>
                    <span className="text-xs text-muted-foreground">
                      {option.description}
                    </span>
                  </div>
                )}
              />
              {errors.product && (
                <p className="text-sm text-red-500">
                  {errors.product}
                </p>
              )}
            </div>

            {/* Available Parts */}
            {ticketData.product_id && (
              <div className="space-y-4">
                <Separator />
                <div>
                  <Label className="text-base font-medium">Linh kiện có thể sử dụng</Label>
                  <p className="text-sm text-muted-foreground">
                    Các linh kiện được cấu hình cho sản phẩm này ({availableParts.filter(part => !selectedParts.find(sp => sp.id === part.id)).length} linh kiện)
                  </p>
                </div>

                {availableParts.length > 0 ? (
                  <>
                    {availableParts.filter(part => !selectedParts.find(sp => sp.id === part.id)).length > 0 ? (
                      <div className="grid gap-3">
                        {availableParts
                          .filter(part => !selectedParts.find(sp => sp.id === part.id))
                          .map((part) => (
                            <div key={part.id} className="flex items-center justify-between p-3 border rounded-lg">
                              <div className="flex flex-col">
                                <span className="font-medium">{part.name}</span>
                                <span className="text-sm text-muted-foreground">
                                  {part.part_number} • Tồn kho: {part.stock_quantity}
                                </span>
                                <span className="text-sm font-medium text-primary">
                                  {new Intl.NumberFormat('vi-VN', {
                                    style: 'currency',
                                    currency: 'VND'
                                  }).format(part.price)}
                                </span>
                              </div>
                              <Button
                                size="sm"
                                onClick={() => addPart(part)}
                                disabled={part.stock_quantity === 0}
                              >
                                <IconPlus className="h-4 w-4" />
                                Thêm
                              </Button>
                            </div>
                          ))}
                      </div>
                    ) : (
                      <div className="text-center py-6 text-muted-foreground">
                        <p className="text-sm">Tất cả linh kiện đã được thêm vào danh sách bên dưới.</p>
                      </div>
                    )}
                  </>
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    <p>Sản phẩm này chưa có linh kiện nào được cấu hình.</p>
                    <p className="text-sm mt-1">Bạn có thể thêm linh kiện vào sản phẩm này trong trang Quản lý sản phẩm.</p>
                  </div>
                )}
              </div>
            )}

            {/* Selected Parts */}
            {selectedParts.length > 0 && (
              <div className="space-y-4">
                <Separator />
                <div>
                  <Label className="text-base font-medium">Linh kiện đã chọn</Label>
                </div>

                <div className="grid gap-3">
                  {selectedParts.map((part) => (
                    <div key={part.id} className="flex items-center justify-between p-3 bg-muted rounded-lg">
                      <div className="flex flex-col">
                        <span className="font-medium">{part.name}</span>
                        <span className="text-sm text-primary">
                          {new Intl.NumberFormat('vi-VN', {
                            style: 'currency',
                            currency: 'VND'
                          }).format(part.price)} × {part.quantity}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Input
                          type="number"
                          min="1"
                          value={part.quantity}
                          onChange={(e) => handlePartQuantityChange(part.id, parseInt(e.target.value) || 0)}
                          className="w-20"
                        />
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() => removePart(part.id)}
                        >
                          <IconTrash className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="flex justify-between">
              <Button variant="outline" onClick={() => setStep(2)}>
                Quay lại
              </Button>
              <Button
                onClick={() => {
                  if (validateProduct()) {
                    setStep(4);
                  }
                }}
                disabled={!canProceedToStep4}
              >
                Tiếp theo
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Bước 4: Chi Phí Dịch Vụ */}
      {step === 4 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <IconCalculator className="h-5 w-5" />
              Chi Phí Dịch Vụ
            </CardTitle>
            <CardDescription>
              Nhập chi phí dịch vụ và các khoản phí
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="service_fee">Giá dịch vụ *</Label>
                <Input
                  id="service_fee"
                  type="number"
                  min="0"
                  value={ticketData.service_fee}
                  onChange={(e) => setTicketData(prev => ({
                    ...prev,
                    service_fee: parseFloat(e.target.value) || 0
                  }))}
                  placeholder="0"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="diagnosis_fee">Phí kiểm tra</Label>
                <Input
                  id="diagnosis_fee"
                  type="number"
                  min="0"
                  value={ticketData.diagnosis_fee}
                  onChange={(e) => setTicketData(prev => ({
                    ...prev,
                    diagnosis_fee: parseFloat(e.target.value) || 0
                  }))}
                  placeholder="0"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="discount_amount">Giảm giá</Label>
                <Input
                  id="discount_amount"
                  type="number"
                  min="0"
                  value={ticketData.discount_amount}
                  onChange={(e) => setTicketData(prev => ({
                    ...prev,
                    discount_amount: parseFloat(e.target.value) || 0
                  }))}
                  placeholder="0"
                />
              </div>
            </div>

            {/* Cost Summary */}
            <div className="space-y-3 p-4 bg-muted rounded-lg">
              <div className="flex justify-between text-sm">
                <span>Giá dịch vụ:</span>
                <span>{new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(ticketData.service_fee)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span>Phí kiểm tra:</span>
                <span>{new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(ticketData.diagnosis_fee)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span>Linh kiện:</span>
                <span>{new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(partsTotal)}</span>
              </div>
              <Separator />
              <div className="flex justify-between text-sm">
                <span>Tạm tính:</span>
                <span>{new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(subtotal)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span>Giảm giá:</span>
                <span>-{new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(ticketData.discount_amount)}</span>
              </div>
              <Separator />
              <div className="flex justify-between font-medium">
                <span>Tổng cộng:</span>
                <span className="text-primary">
                  {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(total)}
                </span>
              </div>
            </div>

            <div className="flex justify-between">
              <Button variant="outline" onClick={() => setStep(3)}>
                Quay lại
              </Button>
              <Button onClick={handleSubmit} disabled={!canSubmit || isLoading}>
                {isLoading ? "Đang tạo..." : "Tạo Phiếu Dịch Vụ"}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}