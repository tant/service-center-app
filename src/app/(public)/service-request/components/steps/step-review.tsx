"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  setActiveStep,
  setWizardConsent,
  setWizardHoneypot,
  useServiceRequestWizardDispatch,
  useServiceRequestWizardState,
} from "@/hooks/use-service-request-wizard";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { format } from "date-fns";

const SERVICE_OPTION_LABELS: Record<string, string> = {
  warranty: "Bảo hành",
  paid: "Dịch vụ trả phí",
  replacement: "Đổi sản phẩm",
};

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

function SummaryRow(props: { label: string; value?: string | null }) {
  if (!props.value) {
    return null;
  }
  return (
    <div className="flex flex-col gap-1 rounded-md border bg-muted/40 p-3">
      <span className="text-xs uppercase text-muted-foreground">{props.label}</span>
      <span className="text-sm">{props.value}</span>
    </div>
  );
}

function SectionHeader(props: { title: string; onEdit?: () => void }) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-3">
      <h3 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
        {props.title}
      </h3>
      {props.onEdit ? (
        <Button type="button" variant="ghost" size="sm" onClick={props.onEdit}>
          Chỉnh sửa
        </Button>
      ) : null}
    </div>
  );
}

function ProductBadge(props: { status: "success" | "error" | "pending" | "idle"; eligible?: boolean }) {
  if (props.status === "success") {
    return (
      <Badge variant={props.eligible ? "default" : "destructive"}>
        {props.eligible ? "Bảo hành khả dụng" : "Không đủ bảo hành"}
      </Badge>
    );
  }
  if (props.status === "error") {
    return <Badge variant="destructive">Lỗi kiểm tra</Badge>;
  }
  if (props.status === "pending") {
    return <Badge variant="secondary">Đang kiểm tra</Badge>;
  }
  return <Badge variant="outline">Chưa kiểm tra</Badge>;
}

function ProductSummary() {
  const state = useServiceRequestWizardState();
  const dispatch = useServiceRequestWizardDispatch();

  if (state.products.length === 0) {
    return (
      <Alert variant="destructive">
        <AlertDescription>Không tìm thấy sản phẩm nào trong yêu cầu. Quay lại bước 1 để bổ sung.</AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="space-y-4">
      {state.products.map((product, index) => {
        const formattedExpiry =
          product.warrantyCheck.status === "success"
            ? formatWarrantyDate(product.warrantyCheck.expiresAt)
            : undefined;

        return (
          <Card key={product.id}>
            <CardHeader className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <div className="text-xs uppercase text-muted-foreground">Sản phẩm #{index + 1}</div>
                <div className="text-lg font-semibold tracking-wide">{product.serialNumber || "Chưa có serial"}</div>
                <CardDescription>
                  {[product.productBrand, product.productModel].filter(Boolean).join(" • ") || "Chưa có thông tin chi tiết"}
                </CardDescription>
              </div>
              <ProductBadge status={product.warrantyCheck.status} eligible={product.warrantyCheck.eligible} />
            </CardHeader>
            <CardContent className="space-y-3">
              <SummaryRow label="Mô tả vấn đề" value={product.issueDescription} />
              <SummaryRow label="Hạn bảo hành" value={formattedExpiry} />
              <div className="flex flex-wrap gap-2">
                <Badge variant="outline">
                  {SERVICE_OPTION_LABELS[product.serviceOption ?? ""] ?? "Chưa chọn dịch vụ"}
                </Badge>
                {product.warrantyRequested ? (
                  <Badge variant="default">Đã yêu cầu xử lý bảo hành</Badge>
                ) : (
                  <Badge variant="secondary">Xử lý theo dịch vụ đã chọn</Badge>
                )}
              </div>
              {product.warrantyCheck.message ? (
                <Alert variant={product.warrantyCheck.eligible ? "default" : "destructive"}>
                  <AlertDescription>{product.warrantyCheck.message}</AlertDescription>
                </Alert>
              ) : null}
              {product.serviceOptionNotes ? (
                <SummaryRow label="Ghi chú dịch vụ" value={product.serviceOptionNotes} />
              ) : null}
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}

export function StepReview() {
  const state = useServiceRequestWizardState();
  const dispatch = useServiceRequestWizardDispatch();

  return (
    <Card>
      <CardHeader>
        <CardTitle>Bước 4: Xem lại & xác nhận</CardTitle>
        <CardDescription>Kiểm tra thông tin trước khi gửi. Có thể quay lại từng bước để cập nhật.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-6">
          <SectionHeader
            title="Thông tin khách hàng"
            onEdit={() => setActiveStep(dispatch, 2)}
          />
          <div className="grid gap-3 md:grid-cols-2">
            <SummaryRow label="Họ và tên" value={state.customer.name} />
            <SummaryRow label="Email" value={state.customer.email} />
            <SummaryRow label="Số điện thoại" value={state.customer.phone} />
            <SummaryRow label="Địa chỉ" value={state.customer.address} />
          </div>
        </div>

        <Separator />

        <div className="space-y-4">
          <SectionHeader
            title="Tiếp nhận sản phẩm"
            onEdit={() => setActiveStep(dispatch, 2)}
          />
          <SummaryRow
            label="Phương thức"
            value={state.delivery.preferredDeliveryMethod === "delivery" ? "Giao nhận" : "Khách tự mang tới"}
          />
          {state.delivery.preferredDeliveryMethod === "delivery" ? (
            <SummaryRow label="Địa chỉ giao nhận" value={state.delivery.deliveryAddress} />
          ) : (
            <SummaryRow label="Ghi chú khi mang đến" value={state.delivery.pickupNotes} />
          )}
          <SummaryRow label="Lịch hẹn mong muốn" value={state.delivery.preferredSchedule} />
          <SummaryRow label="Ghi chú liên hệ" value={state.delivery.contactNotes} />
        </div>

        <Separator />

        {state.requestIssueOverview.trim() ? (
          <>
            <SectionHeader title="Mô tả tổng quát" onEdit={() => setActiveStep(dispatch, 0)} />
            <SummaryRow label="Tổng quan vấn đề" value={state.requestIssueOverview} />
            <Separator />
          </>
        ) : null}

        <div className="space-y-4">
          <SectionHeader title="Danh sách sản phẩm" onEdit={() => setActiveStep(dispatch, 1)} />
          <ProductSummary />
        </div>

        <Separator />

        <div className="flex items-center gap-2">
          <Checkbox
            id="consent"
            checked={state.consentConfirmed}
            onCheckedChange={(checked) => setWizardConsent(dispatch, Boolean(checked))}
          />
          <label htmlFor="consent" className="text-sm leading-none">
            Tôi đồng ý với điều khoản dịch vụ.
          </label>
        </div>
        <input
          type="text"
          className="hidden"
          tabIndex={-1}
          aria-hidden="true"
          value={state.honeypot}
          onChange={(event) => setWizardHoneypot(dispatch, event.target.value)}
        />
      </CardContent>
    </Card>
  );
}
