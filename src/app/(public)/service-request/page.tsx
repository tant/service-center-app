/**
 * Story 1.11: Public Service Request Portal
 * AC 7: Public portal at /service-request (no auth required)
 * AC 3, 4, 8: Multi-step form with warranty verification
 */

"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useVerifyWarranty, useSubmitServiceRequest } from "@/hooks/use-service-request";
import { toast } from "sonner";
import { IconAlertCircle, IconCheck, IconShield } from "@tabler/icons-react";

export default function ServiceRequestPage() {
  const router = useRouter();
  const [step, setStep] = useState(1);

  // Step 1: Serial verification
  const [serial, setSerial] = useState("");
  const { verifyWarranty, isVerifying, data: verificationResult } = useVerifyWarranty();

  // Step 2: Customer details
  const [customerName, setCustomerName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [problemDescription, setProblemDescription] = useState("");
  const [deliveryMethod, setDeliveryMethod] = useState<"pickup" | "delivery">("pickup");
  const [deliveryAddress, setDeliveryAddress] = useState("");
  const [honeypot, setHoneypot] = useState(""); // AC 12: Spam protection

  const { submitRequest, isSubmitting } = useSubmitServiceRequest();

  const handleVerify = () => {
    if (!serial || serial.length < 5) {
      toast.error("Serial number must be at least 5 characters");
      return;
    }

    verifyWarranty(
      { serial_number: serial },
      {
        onError: () => {
          toast.error("Failed to verify serial number");
        },
      }
    );
  };

  const handleSubmit = () => {
    // AC 11: Client-side validation
    if (!customerName || customerName.length < 2) {
      toast.error("Name must be at least 2 characters");
      return;
    }
    if (!email || !email.includes("@")) {
      toast.error("Please enter a valid email");
      return;
    }
    if (!phone || phone.length < 10) {
      toast.error("Phone number must be at least 10 digits");
      return;
    }
    if (problemDescription.length < 20) {
      toast.error("Problem description must be at least 20 characters");
      return;
    }
    if (deliveryMethod === "delivery" && !deliveryAddress) {
      toast.error("Delivery address is required");
      return;
    }

    submitRequest(
      {
        customer_name: customerName,
        customer_email: email,
        customer_phone: phone,
        issue_description: problemDescription,
        items: [
          {
            serial_number: serial,
          },
        ],
        receipt_status: "pending_receipt", // Customers request service first, send product later
        preferred_delivery_method: deliveryMethod,
        delivery_address: deliveryMethod === "delivery" ? deliveryAddress : undefined,
        honeypot, // AC 12: Spam protection
      },
      {
        onSuccess: (result) => {
          router.push(`/service-request/success?token=${result.tracking_token}`);
        },
        onError: (error: any) => {
          toast.error(error.message || "Failed to submit request");
        },
      }
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-muted p-4 md:p-8">
      <div className="max-w-2xl mx-auto space-y-6">
        {/* Header */}
        <div className="text-center space-y-2">
          <h1 className="text-3xl md:text-4xl font-bold">Yêu cầu dịch vụ bảo hành</h1>
          <p className="text-muted-foreground">
            Gửi yêu cầu dịch vụ trực tuyến
          </p>
        </div>

        {/* Step 1: Serial Verification */}
        {step === 1 && (
          <Card>
            <CardHeader>
              <CardTitle>Bước 1: Xác thực sản phẩm</CardTitle>
              <CardDescription>
                Nhập số serial để kiểm tra tình trạng bảo hành
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="serial">Số Serial *</Label>
                <div className="flex gap-2">
                  <Input
                    id="serial"
                    placeholder="ABC123456"
                    value={serial}
                    onChange={(e) => setSerial(e.target.value.toUpperCase())}
                    onKeyDown={(e) => e.key === "Enter" && handleVerify()}
                  />
                  <Button onClick={handleVerify} disabled={!serial || isVerifying}>
                    {isVerifying ? "Đang xác thực..." : "Xác thực"}
                  </Button>
                </div>
              </div>

              {verificationResult && (
                <div>
                  {!verificationResult.found ? (
                    <Alert variant="destructive">
                      <IconAlertCircle className="h-4 w-4" />
                      <AlertDescription>{verificationResult.message}</AlertDescription>
                    </Alert>
                  ) : (
                    "product" in verificationResult && "warranty" in verificationResult && (
                      <div className="border rounded-lg p-4 space-y-3">
                        <div className="flex items-start justify-between">
                          <div>
                            <h3 className="font-semibold">{verificationResult.product.name}</h3>
                            <p className="text-sm text-muted-foreground">
                              {verificationResult.product.brand} - {verificationResult.product.serial}
                            </p>
                          </div>
                          <IconShield className={`h-6 w-6 ${verificationResult.eligible ? "text-green-500" : "text-orange-500"}`} />
                        </div>

                        <Alert variant={verificationResult.eligible ? "default" : "default"}>
                          <AlertDescription>
                            <strong>Trạng thái:</strong> {verificationResult.message}
                            {verificationResult.warranty.daysRemaining !== null && (
                              <span className="block mt-1 text-sm">
                                Còn {verificationResult.warranty.daysRemaining} ngày bảo hành
                              </span>
                            )}
                          </AlertDescription>
                        </Alert>

                        <Button className="w-full" onClick={() => setStep(2)}>
                          Tiếp tục
                        </Button>
                      </div>
                    )
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Step 2: Request Details */}
        {step === 2 && (
          <Card>
            <CardHeader>
              <CardTitle>Bước 2: Thông tin yêu cầu</CardTitle>
              <CardDescription>
                Cung cấp thông tin liên hệ và mô tả vấn đề
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="name">Họ và tên *</Label>
                <Input
                  id="name"
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  required
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="email">Email *</Label>
                  <Input
                    type="email"
                    id="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="phone">Số điện thoại *</Label>
                  <Input
                    type="tel"
                    id="phone"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    required
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="problem">Mô tả vấn đề *</Label>
                <Textarea
                  id="problem"
                  placeholder="Mô tả chi tiết vấn đề bạn gặp phải..."
                  value={problemDescription}
                  onChange={(e) => setProblemDescription(e.target.value)}
                  rows={4}
                  required
                />
                {problemDescription.length > 0 && problemDescription.length < 20 && (
                  <p className="text-sm text-destructive mt-1">
                    Tối thiểu 20 ký tự ({problemDescription.length}/20)
                  </p>
                )}
              </div>

              <div>
                <Label>Phương thức nhận hàng *</Label>
                <RadioGroup value={deliveryMethod} onValueChange={(v: any) => setDeliveryMethod(v)}>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="pickup" id="pickup" />
                    <Label htmlFor="pickup" className="font-normal">Tôi sẽ đến lấy tại trung tâm</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="delivery" id="delivery" />
                    <Label htmlFor="delivery" className="font-normal">Giao đến địa chỉ của tôi</Label>
                  </div>
                </RadioGroup>
              </div>

              {deliveryMethod === "delivery" && (
                <div>
                  <Label htmlFor="address">Địa chỉ giao hàng *</Label>
                  <Textarea
                    id="address"
                    placeholder="Số nhà, Đường, Phường/Xã, Quận/Huyện, Tỉnh/TP"
                    value={deliveryAddress}
                    onChange={(e) => setDeliveryAddress(e.target.value)}
                    rows={3}
                    required
                  />
                </div>
              )}

              {/* AC 12: Honeypot field (hidden) */}
              <input
                type="text"
                name="website"
                value={honeypot}
                onChange={(e) => setHoneypot(e.target.value)}
                style={{ position: "absolute", left: "-9999px" }}
                tabIndex={-1}
                autoComplete="off"
              />

              <div className="flex gap-2">
                <Button variant="outline" onClick={() => setStep(1)}>
                  Quay lại
                </Button>
                <Button
                  className="flex-1"
                  onClick={handleSubmit}
                  disabled={
                    !customerName ||
                    !email ||
                    !phone ||
                    problemDescription.length < 20 ||
                    (deliveryMethod === "delivery" && !deliveryAddress) ||
                    isSubmitting
                  }
                >
                  {isSubmitting ? "Đang gửi..." : "Gửi yêu cầu"}
                </Button>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
