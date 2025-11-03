"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ServiceRequestWizard } from "./components/service-request-wizard";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { useVerifyWarranty, useSubmitServiceRequest } from "@/hooks/use-service-request";


export default function ServiceRequestPage() {
  const router = useRouter();
  const [_step, _setStep] = useState(1);

  // Step 1: Serial verification
  const [serial, _setSerial] = useState("");
  const { verifyWarranty, isVerifying, data: verificationResult } = useVerifyWarranty();

  // Step 2: Customer details
  const [customerName, _setCustomerName] = useState("");
  const [email, _setEmail] = useState("");
  const [phone, _setPhone] = useState("");
  const [problemDescription, _setProblemDescription] = useState("");
  const [deliveryMethod, _setDeliveryMethod] = useState<"pickup" | "delivery">("pickup");
  const [deliveryAddress, _setDeliveryAddress] = useState("");
  const [honeypot, _setHoneypot] = useState(""); // AC 12: Spam protection

  const { submitRequest, isSubmitting } = useSubmitServiceRequest();

  const _handleVerify = () => {
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

  const _handleSubmit = () => {
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
    <div className="container mx-auto max-w-6xl space-y-8 py-12">
      <Card>
        <CardHeader>
          <CardTitle>Yêu cầu dịch vụ</CardTitle>
          <CardDescription>
            Luồng nhiều bước đang được tái cấu trúc theo tài liệu mới. Một số tính năng sẽ được bổ sung ở các bước tiếp theo.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ServiceRequestWizard />
        </CardContent>
      </Card>
    </div>
  );
}

