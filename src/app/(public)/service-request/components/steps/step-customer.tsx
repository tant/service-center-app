"use client";

import { useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { setWizardCustomer, setWizardDelivery, useServiceRequestWizardDispatch, useServiceRequestWizardState } from "@/hooks/use-service-request-wizard";
import { Textarea } from "@/components/ui/textarea";
import { useCustomerLookup } from "@/hooks/use-customer-lookup";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { IconLoader2 } from "@tabler/icons-react";

export function StepCustomer() {
  const state = useServiceRequestWizardState();
  const dispatch = useServiceRequestWizardDispatch();
  const { enable, disable, data, isLoading, error } = useCustomerLookup(state.customer.phone);

  type LookupResponse = {
    found: boolean;
    customer?: {
      name?: string | null;
      email?: string | null;
      phone?: string | null;
      address?: string | null;
      preferred_delivery_method?: "pickup" | "delivery" | null;
      delivery_address?: string | null;
    } | null;
  };

  useEffect(() => {
    const lookupData = (data ?? null) as LookupResponse | null;
    const lookup = lookupData?.customer ?? null;
    if (!lookup) {
      return;
    }

    setWizardCustomer(dispatch, {
      name: state.customer.name || lookup.name || "",
      email: state.customer.email || lookup.email || "",
      phone: state.customer.phone,
      address: state.customer.address || lookup.address || "",
    });

    if (lookup.preferred_delivery_method) {
      setWizardDelivery(dispatch, {
        preferredDeliveryMethod: lookup.preferred_delivery_method,
        deliveryAddress: state.delivery.deliveryAddress || lookup.delivery_address || "",
        preferredSchedule: state.delivery.preferredSchedule,
        pickupNotes: state.delivery.pickupNotes,
        contactNotes: state.delivery.contactNotes,
      });
    }
  }, [data, dispatch, state.customer.address, state.customer.email, state.customer.name, state.customer.phone, state.delivery.contactNotes, state.delivery.deliveryAddress, state.delivery.pickupNotes, state.delivery.preferredSchedule]);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Bước 3: Khách hàng & tiếp nhận</CardTitle>
        <CardDescription>
          Tìm khách hàng theo số điện thoại để tự động điền thông tin nếu đã từng gửi yêu cầu.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="customer-name">Họ và tên</Label>
            <Input
              id="customer-name"
              value={state.customer.name}
              onChange={(event) =>
                setWizardCustomer(dispatch, { ...state.customer, name: event.target.value })
              }
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="customer-email">Email</Label>
            <Input
              id="customer-email"
              type="email"
              value={state.customer.email}
              onChange={(event) =>
                setWizardCustomer(dispatch, { ...state.customer, email: event.target.value })
              }
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="customer-phone">Số điện thoại</Label>
            <Input
              id="customer-phone"
              inputMode="tel"
              value={state.customer.phone}
              onChange={(event) =>
                setWizardCustomer(dispatch, { ...state.customer, phone: event.target.value })
              }
              onBlur={() => enable()}
              onFocus={() => disable()}
            />
            <p className="text-xs text-muted-foreground">
              Rời khỏi ô nhập để tìm info tự động. Có thể chỉnh sửa lại sau khi auto-fill.
            </p>
            {isLoading ? (
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <IconLoader2 className="h-3 w-3 animate-spin" />
                Đang tra cứu khách hàng...
              </div>
            ) : null}
            {error ? (
              <Alert variant="destructive">
                <AlertDescription>
                  {error.message || "Không thể tra cứu thông tin khách hàng."}
                </AlertDescription>
              </Alert>
            ) : null}
          </div>
          <div className="space-y-2">
            <Label htmlFor="customer-address">Địa chỉ</Label>
            <Textarea
              id="customer-address"
              value={state.customer.address ?? ""}
              onChange={(event) =>
                setWizardCustomer(dispatch, { ...state.customer, address: event.target.value })
              }
            />
          </div>
        </div>

        <div className="space-y-3">
          <Label>Phương thức tiếp nhận</Label>
          <RadioGroup
            value={state.delivery.preferredDeliveryMethod}
            onValueChange={(value) =>
              setWizardDelivery(dispatch, {
                ...state.delivery,
                preferredDeliveryMethod: value as typeof state.delivery.preferredDeliveryMethod,
              })
            }
            className="flex flex-col gap-2 md:flex-row"
          >
            <div className="flex items-center gap-2 rounded-md border p-3">
              <RadioGroupItem value="pickup" id="delivery-method-pickup" />
              <Label htmlFor="delivery-method-pickup" className="cursor-pointer">
                Tự mang đến chi nhánh
              </Label>
            </div>
            <div className="flex items-center gap-2 rounded-md border p-3">
              <RadioGroupItem value="delivery" id="delivery-method-delivery" />
              <Label htmlFor="delivery-method-delivery" className="cursor-pointer">
                Thu gom / giao nhận
              </Label>
            </div>
          </RadioGroup>
        </div>

        {state.delivery.preferredDeliveryMethod === "delivery" ? (
          <div className="space-y-2">
            <Label htmlFor="delivery-address">Địa chỉ giao nhận</Label>
            <Textarea
              id="delivery-address"
              value={state.delivery.deliveryAddress ?? ""}
              onChange={(event) =>
                setWizardDelivery(dispatch, { ...state.delivery, deliveryAddress: event.target.value })
              }
            />
            <Label htmlFor="preferred-schedule" className="text-sm">
              Lịch hẹn mong muốn
            </Label>
            <Input
              id="preferred-schedule"
              type="date"
              value={state.delivery.preferredSchedule ?? ""}
              onChange={(event) =>
                setWizardDelivery(dispatch, { ...state.delivery, preferredSchedule: event.target.value })
              }
            />
          </div>
        ) : (
          <div className="space-y-2">
            <Label htmlFor="pickup-notes">Ghi chú khi mang đến</Label>
            <Textarea
              id="pickup-notes"
              value={state.delivery.pickupNotes ?? ""}
              onChange={(event) =>
                setWizardDelivery(dispatch, { ...state.delivery, pickupNotes: event.target.value })
              }
            />
          </div>
        )}

        <div className="space-y-2">
          <Label htmlFor="contact-notes">Ghi chú liên hệ (tuỳ chọn)</Label>
          <Textarea
            id="contact-notes"
            value={state.delivery.contactNotes ?? ""}
            onChange={(event) =>
              setWizardDelivery(dispatch, { ...state.delivery, contactNotes: event.target.value })
            }
          />
        </div>
      </CardContent>
    </Card>
  );
}
