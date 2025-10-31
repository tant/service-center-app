"use client";

import { useMemo, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { removeWizardProduct, updateWizardProduct, useServiceRequestWizardDispatch, useServiceRequestWizardState } from "@/hooks/use-service-request-wizard";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useVerifyWarranty } from "@/hooks/use-service-request";
import { IconRefresh, IconShieldCheck, IconShieldX, IconShieldQuestion, IconAlertCircle } from "@tabler/icons-react";
import type { ServiceType } from "@/types/enums";
import { format } from "date-fns";

const STATUS_BADGE_VARIANT: Record<string, "default" | "outline" | "secondary" | "destructive"> = {
  idle: "outline",
  pending: "secondary",
  success: "default",
  error: "destructive",
};

const SERVICE_OPTIONS = [
  { value: "warranty", label: "Bảo hành" },
  { value: "paid", label: "Dịch vụ trả phí" },
  { value: "replacement", label: "Đổi sản phẩm" },
] as const;

const formatWarrantyDate = (iso?: string | null) => {
  if (!iso) {
    return undefined;
  }

  const date = new Date(iso);
  if (isNaN(date.getTime())) {
    return undefined;
  }
  return format(date, "dd/MM/yyyy");
};

export function StepSolutions() {
  const state = useServiceRequestWizardState();
  const dispatch = useServiceRequestWizardDispatch();
  const { verifyWarrantyAsync, isVerifying } = useVerifyWarranty();
  const [verifyingProductIds, setVerifyingProductIds] = useState<Record<string, boolean>>({});

  const handleServiceChange = (id: string, value: string) => {
    updateWizardProduct(dispatch, id, { serviceOption: value as ServiceType });
  };

  const productsWithSerial = useMemo(
    () =>
      state.products.filter(
        (product) => product.serialNumber.trim().length > 0
      ),
    [state.products]
  );

  const handleVerifyWarranty = async (productId: string) => {
    const product = state.products.find((item) => item.id === productId);
    if (!product) {
      return;
    }

    const serial = product.serialNumber.trim().toUpperCase();
    if (serial.length === 0) {
      updateWizardProduct(dispatch, productId, {
        warrantyCheck: {
          status: "error",
          message: "Serial trống. Quay lại bước 1 để cập nhật.",
        },
      });
      return;
    }

    setVerifyingProductIds((prev) => ({ ...prev, [productId]: true }));
    updateWizardProduct(dispatch, productId, {
      serialNumber: serial,
      warrantyCheck: { status: "pending" },
    });

    try {
      const result = await verifyWarrantyAsync({ serial_number: serial });

      if (!result?.found) {
        updateWizardProduct(dispatch, productId, {
          warrantyCheck: {
            status: "error",
            eligible: false,
            message: result?.message ?? "Không tìm thấy thông tin bảo hành cho serial này.",
          },
          warrantyRequested: false,
          serviceOption: "paid",
        });
        return;
      }

      const eligible = Boolean(result.eligible);
      const message =
        result.message ??
        (eligible ? "Sản phẩm đủ điều kiện bảo hành." : "Không đủ điều kiện bảo hành.");
      const warrantyInfo =
        result && typeof result === "object" && "warranty" in result ? (result as { warranty?: { endDate?: string | null; manufacturerEndDate?: string | null; userEndDate?: string | null } }).warranty : undefined;
      const expiresAt =
        warrantyInfo?.endDate ??
        warrantyInfo?.manufacturerEndDate ??
        warrantyInfo?.userEndDate ??
        null;

      updateWizardProduct(dispatch, productId, {
        productBrand: result.product?.brand ?? product.productBrand,
        productModel: result.product?.name ?? product.productModel,
        warrantyCheck: {
          status: "success",
          eligible,
          message,
          expiresAt: expiresAt ?? undefined,
        },
        warrantyRequested: eligible,
        serviceOption: eligible ? "warranty" : product.serviceOption ?? "paid",
      });
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "Không thể kiểm tra tình trạng bảo hành. Vui lòng thử lại.";

      updateWizardProduct(dispatch, productId, {
        warrantyCheck: {
          status: "error",
          eligible: false,
          message,
        },
        warrantyRequested: false,
      });
    } finally {
      setVerifyingProductIds((prev) => {
        const next = { ...prev };
        delete next[productId];
        return next;
      });
    }
  };

  const toggleWarrantyRequested = (productId: string, requested: boolean) => {
    updateWizardProduct(dispatch, productId, { warrantyRequested: requested });
  };

  const updateServiceNotes = (productId: string, notes: string) => {
    updateWizardProduct(dispatch, productId, { serviceOptionNotes: notes });
  };

  const renderStatusIcon = (status: string, eligible?: boolean) => {
    if (status === "success") {
      return eligible ? <IconShieldCheck className="h-4 w-4" /> : <IconShieldX className="h-4 w-4" />;
    }
    if (status === "error") {
      return <IconAlertCircle className="h-4 w-4" />;
    }
    if (status === "pending") {
      return <IconRefresh className="h-4 w-4 animate-spin" />;
    }
    return <IconShieldQuestion className="h-4 w-4" />;
  };

  return (
    <Card>
      <CardHeader className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <CardTitle>Bước 2: Kiểm tra bảo hành & giải pháp</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {state.products.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            Chưa có sản phẩm để cấu hình. Quay lại bước trước để thêm serial.
          </p>
        ) : (
          state.products.map((product) => {
            const status = product.warrantyCheck.status;
            const verifying = verifyingProductIds[product.id] || isVerifying;
            const hasSerial = product.serialNumber.trim().length > 0;
            const eligible = product.warrantyCheck.eligible;
            const formattedExpiry =
              status === "success" ? formatWarrantyDate(product.warrantyCheck.expiresAt) : undefined;

            return (
              <div key={product.id} className="flex flex-col gap-4 rounded-md border p-4">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2 text-sm uppercase tracking-wide text-muted-foreground">
                      Serial
                      <Badge variant="outline">{product.serialNumber || "Chưa nhập"}</Badge>
                    </div>
                    {product.productBrand || product.productModel ? (
                      <CardDescription className="mt-1">
                        {[product.productBrand, product.productModel].filter(Boolean).join(" • ")}
                      </CardDescription>
                    ) : null}
                  </div>
                  <Badge variant={STATUS_BADGE_VARIANT[status] ?? "outline"} className="flex items-center gap-1">
                    {renderStatusIcon(status, eligible)}
                    {status === "success"
                      ? eligible
                        ? "Đủ điều kiện bảo hành"
                        : "Không đủ bảo hành"
                      : status === "error"
                      ? "Lỗi kiểm tra"
                      : status === "pending"
                      ? "Đang kiểm tra"
                      : "Chưa kiểm tra"}
                  </Badge>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    disabled={!hasSerial || verifying}
                    onClick={() => handleVerifyWarranty(product.id).catch(() => undefined)}
                  >
                    <IconShieldCheck className="mr-2 h-4 w-4" />
                    Kiểm tra bảo hành
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="text-destructive"
                    onClick={() => removeWizardProduct(dispatch, product.id)}
                  >
                    Xóa sản phẩm
                  </Button>
                </div>

                {product.warrantyCheck.message ? (
                  <Alert variant={eligible ? "default" : "destructive"}>
                    <AlertDescription>{product.warrantyCheck.message}</AlertDescription>
                  </Alert>
                ) : null}

                {formattedExpiry ? (
                  <p className="text-xs text-muted-foreground">
                    Hạn bảo hành: {formattedExpiry}
                  </p>
                ) : null}

                <div className="space-y-2 rounded-md border bg-muted/40 p-4">
                  <Label className="text-xs font-semibold uppercase text-muted-foreground">
                    Tùy chọn dịch vụ
                  </Label>
                  <Select
                    value={product.serviceOption}
                    onValueChange={(value) => handleServiceChange(product.id, value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Chọn dịch vụ" />
                    </SelectTrigger>
                    <SelectContent>
                      {SERVICE_OPTIONS.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>

                  <div className="flex items-center justify-between gap-3 rounded-md border p-3">
                    <div>
                      <Label htmlFor={`warranty-toggle-${product.id}`} className="font-medium">
                        Yêu cầu xử lý theo diện bảo hành
                      </Label>
                      <p className="text-xs text-muted-foreground">
                        Nếu không đủ điều kiện, sản phẩm vẫn sẽ được xử lý theo dịch vụ đã chọn.
                      </p>
                    </div>
                    <Switch
                      id={`warranty-toggle-${product.id}`}
                      checked={product.warrantyRequested}
                      onCheckedChange={(checked) => toggleWarrantyRequested(product.id, Boolean(checked))}
                    />
                  </div>

                  <div className="space-y-1">
                    <Label htmlFor={`service-notes-${product.id}`}>Ghi chú thêm (tuỳ chọn)</Label>
                    <Textarea
                      id={`service-notes-${product.id}`}
                      placeholder="Ghi chú thêm cho trung tâm dịch vụ"
                      value={product.serviceOptionNotes ?? ""}
                      onChange={(event) => updateServiceNotes(product.id, event.target.value)}
                      rows={3}
                    />
                  </div>
                </div>
              </div>
            );
          })
        )}

        {productsWithSerial.length === 0 ? (
          <Alert>
            <AlertDescription>
              Vui lòng đảm bảo mỗi sản phẩm có serial hợp lệ ở bước trước trước khi kiểm tra bảo hành.
            </AlertDescription>
          </Alert>
        ) : null}
      </CardContent>
    </Card>
  );
}
