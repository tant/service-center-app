"use client";

import {
  IconAlertCircle,
  IconRefresh,
  IconShieldCheck,
  IconShieldQuestion,
  IconShieldX,
} from "@tabler/icons-react";
import { format } from "date-fns";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useVerifyWarranty } from "@/hooks/use-service-request";
import {
  removeWizardProduct,
  updateWizardProduct,
  useServiceRequestWizardDispatch,
  useServiceRequestWizardState,
} from "@/hooks/use-service-request-wizard";
import type { ServiceType } from "@/types/enums";

const STATUS_BADGE_VARIANT: Record<
  string,
  "default" | "outline" | "secondary" | "destructive"
> = {
  idle: "outline",
  pending: "secondary",
  success: "default",
  error: "destructive",
};

const MIN_SERIAL_LENGTH = 5;

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
  if (Number.isNaN(date.getTime())) {
    return undefined;
  }
  return format(date, "dd/MM/yyyy");
};

export function StepSolutions() {
  const state = useServiceRequestWizardState();
  const dispatch = useServiceRequestWizardDispatch();
  const { verifyWarrantyAsync, isVerifying } = useVerifyWarranty();
  const [verifyingProductIds, setVerifyingProductIds] = useState<
    Record<string, boolean>
  >({});
  const [isBulkVerifying, setIsBulkVerifying] = useState(false);
  const autoVerifiedSerialRef = useRef<Record<string, string>>({});

  const handleServiceChange = (id: string, value: string) => {
    updateWizardProduct(dispatch, id, { serviceOption: value as ServiceType });
  };

  const productsWithSerial = useMemo(
    () =>
      state.products.filter(
        (product) => product.serialNumber.trim().length > 0,
      ),
    [state.products],
  );

  const verifyProduct = useCallback(
    async (
      productId: string,
    ): Promise<"eligible" | "ineligible" | "error" | "skipped"> => {
      const product = state.products.find((item) => item.id === productId);
      if (!product) {
        return "skipped";
      }

      const serial = product.serialNumber.trim().toUpperCase();
      if (serial.length < MIN_SERIAL_LENGTH) {
        updateWizardProduct(dispatch, productId, {
          warrantyCheck: {
            status: "error",
            message: `Serial cần tối thiểu ${MIN_SERIAL_LENGTH} ký tự để kiểm tra.`,
            notFound: false,
          },
        });
        return "skipped";
      }

      setVerifyingProductIds((prev) => ({ ...prev, [productId]: true }));
      updateWizardProduct(dispatch, productId, {
        serialNumber: serial,
        warrantyCheck: { status: "pending", notFound: false },
      });

      try {
        const result = await verifyWarrantyAsync({ serial_number: serial });

        if (!result?.found) {
          updateWizardProduct(dispatch, productId, {
            warrantyCheck: {
              status: "error",
              eligible: false,
              message:
                result?.message ??
                "Không tìm thấy thông tin bảo hành cho serial này.",
              notFound: true,
            },
            warrantyRequested: false,
            serviceOption: "paid",
          });
          return "error";
        }

        const eligible = Boolean(result.eligible);
        const message =
          result.message ??
          (eligible
            ? "Sản phẩm đủ điều kiện bảo hành."
            : "Không đủ điều kiện bảo hành.");
        const warrantyInfo =
          result && typeof result === "object" && "warranty" in result
            ? (
                result as {
                  warranty?: {
                    endDate?: string | null;
                    manufacturerEndDate?: string | null;
                    userEndDate?: string | null;
                  };
                }
              ).warranty
            : undefined;
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
            notFound: false,
          },
          warrantyRequested: eligible,
          serviceOption: eligible
            ? "warranty"
            : (product.serviceOption ?? "paid"),
        });

        return eligible ? "eligible" : "ineligible";
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
            notFound: false,
          },
          warrantyRequested: false,
        });
        return "error";
      } finally {
        setVerifyingProductIds((prev) => {
          const next = { ...prev };
          delete next[productId];
          return next;
        });
      }
    },
    [dispatch, state.products, verifyWarrantyAsync],
  );

  const bulkVerifyProducts = useCallback(
    async (
      productIds: string[],
      options: { origin?: "manual" | "auto"; showToast?: boolean } = {},
    ) => {
      const { origin = "manual", showToast = false } = options;
      const uniqueIds = Array.from(new Set(productIds));
      const validIds = uniqueIds.filter((id) => {
        const product = state.products.find((item) => item.id === id);
        return Boolean(
          product && product.serialNumber.trim().length >= MIN_SERIAL_LENGTH,
        );
      });

      if (validIds.length === 0) {
        if (origin === "manual" && showToast) {
          toast.info("Không có sản phẩm hợp lệ để kiểm tra.");
        }
        return;
      }

      setIsBulkVerifying(true);
      const counts = { eligible: 0, ineligible: 0, error: 0, skipped: 0 };

      try {
        for (const id of validIds) {
          const outcome = await verifyProduct(id);
          counts[outcome as keyof typeof counts] += 1;
        }
      } finally {
        setIsBulkVerifying(false);
      }

      if (!showToast) {
        return;
      }

      const totalChecked = counts.eligible + counts.ineligible;
      if (totalChecked === 0 && counts.error === 0) {
        toast.info("Không có sản phẩm nào được kiểm tra.");
        return;
      }

      const baseMessage = `${totalChecked} sản phẩm đã được kiểm tra.`;
      if (counts.error > 0) {
        toast.warning(
          `${baseMessage} ${counts.error} sản phẩm gặp lỗi khi kiểm tra.`,
        );
      } else if (counts.eligible > 0) {
        toast.success(
          `${baseMessage} ${counts.eligible} sản phẩm đủ điều kiện bảo hành.`,
        );
      } else {
        toast.info(
          `${baseMessage} Không có sản phẩm nào đủ điều kiện bảo hành.`,
        );
      }
    },
    [state.products, verifyProduct],
  );

  useEffect(() => {
    const cache = autoVerifiedSerialRef.current;

    state.products.forEach((product) => {
      const serial = product.serialNumber.trim().toUpperCase();
      if (serial.length < MIN_SERIAL_LENGTH) {
        delete cache[product.id];
      }
    });

    const autoTargets = state.products.filter((product) => {
      const serial = product.serialNumber.trim().toUpperCase();
      if (serial.length < MIN_SERIAL_LENGTH) {
        return false;
      }
      if (product.warrantyCheck.status !== "idle") {
        return false;
      }
      const cachedSerial = cache[product.id];
      return cachedSerial !== serial;
    });

    if (autoTargets.length === 0) {
      return;
    }

    autoTargets.forEach((product) => {
      cache[product.id] = product.serialNumber.trim().toUpperCase();
    });

    void bulkVerifyProducts(
      autoTargets.map((product) => product.id),
      { origin: "auto", showToast: true },
    );
  }, [bulkVerifyProducts, state.products]);

  const handleVerifyWarranty = async (productId: string) => {
    await verifyProduct(productId);
  };

  const handleBulkVerify = async () => {
    await bulkVerifyProducts(
      productsWithSerial.map((product) => product.id),
      { origin: "manual", showToast: true },
    );
  };

  const hasVerifiableProducts = productsWithSerial.length > 0;

  const updateServiceNotes = (productId: string, notes: string) => {
    updateWizardProduct(dispatch, productId, { serviceOptionNotes: notes });
  };

  const renderStatusIcon = (status: string, eligible?: boolean) => {
    if (status === "success") {
      return eligible ? (
        <IconShieldCheck className="h-4 w-4" />
      ) : (
        <IconShieldX className="h-4 w-4" />
      );
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
      <CardHeader className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="space-y-1">
          <CardTitle>Bước 2: Kiểm tra bảo hành & giải pháp</CardTitle>
          <CardDescription>
            Kiểm tra tự động và cập nhật phương án xử lý cho từng sản phẩm.
          </CardDescription>
        </div>
        {hasVerifiableProducts ? (
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => handleBulkVerify().catch(() => undefined)}
            disabled={isBulkVerifying || isVerifying}
          >
            {isBulkVerifying || isVerifying ? (
              <IconRefresh className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <IconShieldCheck className="mr-2 h-4 w-4" />
            )}
            Kiểm tra tất cả
          </Button>
        ) : null}
      </CardHeader>
      <CardContent className="space-y-4">
        {state.products.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            Chưa có sản phẩm để cấu hình. Quay lại bước trước để thêm serial.
          </p>
        ) : (
          state.products.map((product) => {
            const status = product.warrantyCheck.status;
            const verifying =
              verifyingProductIds[product.id] || isVerifying || isBulkVerifying;
            const hasSerial = product.serialNumber.trim().length > 0;
            const eligible = product.warrantyCheck.eligible;
            const formattedExpiry =
              status === "success"
                ? formatWarrantyDate(product.warrantyCheck.expiresAt)
                : undefined;

            return (
              <div
                key={product.id}
                className="flex flex-col gap-4 rounded-md border p-4"
              >
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2 text-sm uppercase tracking-wide text-muted-foreground">
                      Serial
                      <Badge variant="outline">
                        {product.serialNumber || "Chưa nhập"}
                      </Badge>
                    </div>
                    {product.productBrand || product.productModel ? (
                      <CardDescription className="mt-1">
                        {[product.productBrand, product.productModel]
                          .filter(Boolean)
                          .join(" • ")}
                      </CardDescription>
                    ) : null}
                  </div>
                  <Badge
                    variant={STATUS_BADGE_VARIANT[status] ?? "outline"}
                    className="flex items-center gap-1"
                  >
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
                    onClick={() => void handleVerifyWarranty(product.id)}
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
                    <AlertDescription>
                      {product.warrantyCheck.message}
                    </AlertDescription>
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
                    onValueChange={(value) =>
                      handleServiceChange(product.id, value)
                    }
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

                  <div className="space-y-1">
                    <Label htmlFor={`service-notes-${product.id}`}>
                      Ghi chú thêm (tuỳ chọn)
                    </Label>
                    <Textarea
                      id={`service-notes-${product.id}`}
                      placeholder="Ghi chú thêm cho trung tâm dịch vụ"
                      value={product.serviceOptionNotes ?? ""}
                      onChange={(event) =>
                        updateServiceNotes(product.id, event.target.value)
                      }
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
              Vui lòng đảm bảo mỗi sản phẩm có serial hợp lệ ở bước trước trước
              khi kiểm tra bảo hành.
            </AlertDescription>
          </Alert>
        ) : null}
      </CardContent>
    </Card>
  );
}
