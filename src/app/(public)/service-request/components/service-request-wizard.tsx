"use client";

import { Fragment } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import {
  ServiceRequestWizardProvider,
  WizardStep,
  buildWizardPayload,
  setActiveStep,
  setWizardConsent,
  useServiceRequestWizardDispatch,
  useServiceRequestWizardState,
} from "@/hooks/use-service-request-wizard";
import { StepCustomer, StepProducts, StepReview, StepSolutions } from "./steps";
import { useSubmitServiceRequest } from "@/hooks/use-service-request";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

const STEP_CONFIG: Array<{ id: WizardStep; title: string; description: string }> = [
  { id: 0, title: "Sản phẩm & vấn đề", description: "Thêm sản phẩm và mô tả triệu chứng." },
  { id: 1, title: "Bảo hành & dịch vụ", description: "Kiểm tra bảo hành, chọn phương án xử lý." },
  { id: 2, title: "Khách hàng & tiếp nhận", description: "Thu thập thông tin liên hệ và phương thức." },
  { id: 3, title: "Xem lại & xác nhận", description: "Kiểm tra lần cuối trước khi gửi yêu cầu." },
];

const STEP_COMPONENT_MAP: Record<WizardStep, React.ComponentType> = {
  0: StepProducts,
  1: StepSolutions,
  2: StepCustomer,
  3: StepReview,
};

function WizardNavigator() {
  const state = useServiceRequestWizardState();
  const dispatch = useServiceRequestWizardDispatch();

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-2">
        {STEP_CONFIG.map((step, index) => (
          <Fragment key={step.id}>
            <button
              type="button"
              className="flex flex-col items-start gap-1 rounded-md border border-transparent bg-muted/50 p-3 text-left transition hover:border-muted-foreground/20"
              onClick={() => setActiveStep(dispatch, step.id)}
            >
              <div className="flex items-center gap-2">
                <Badge variant={state.activeStep === step.id ? "default" : "outline"}>Bước {index + 1}</Badge>
                <span className="font-semibold">{step.title}</span>
              </div>
              <span className="text-sm text-muted-foreground">{step.description}</span>
            </button>
            {index < STEP_CONFIG.length - 1 ? <Separator /> : null}
          </Fragment>
        ))}
      </div>
    </div>
  );
}

function WizardContent() {
  const state = useServiceRequestWizardState();
  const StepComponent = STEP_COMPONENT_MAP[state.activeStep];

  return (
    <div className="space-y-4">
      <StepComponent />
      <div className="flex flex-wrap justify-between gap-2">
        <StepNavigation />
      </div>
    </div>
  );
}

function StepNavigation() {
  const state = useServiceRequestWizardState();
  const dispatch = useServiceRequestWizardDispatch();
  const router = useRouter();
  const { submitRequestAsync, isSubmitting } = useSubmitServiceRequest();

  const goPrev = () => {
    const prev = Math.max(0, state.activeStep - 1) as WizardStep;
    setActiveStep(dispatch, prev);
  };

  const goNext = () => {
    const next = Math.min(3, state.activeStep + 1) as WizardStep;
    setActiveStep(dispatch, next);
  };

  const handleSubmit = async () => {
    if (!state.consentConfirmed) {
      toast.error("Vui lòng xác nhận đồng ý điều khoản trước khi gửi.");
      return;
    }

    const payload = buildWizardPayload(state);

    if (payload.items.length === 0) {
      toast.error("Cần ít nhất một sản phẩm hợp lệ để gửi yêu cầu.");
      setActiveStep(dispatch, 0);
      return;
    }

    if (payload.delivery.preferred_delivery_method === "delivery" && !payload.delivery.delivery_address) {
      toast.error("Vui lòng bổ sung địa chỉ giao nhận.");
      setActiveStep(dispatch, 2);
      return;
    }

    try {
      const result = await submitRequestAsync({
        customer_name: payload.customer.name,
        customer_email: payload.customer.email,
        customer_phone: payload.customer.phone,
        issue_description: payload.issue_overview ?? "",
        items: payload.items.map((item) => ({
          serial_number: item.serial_number,
          product_brand: item.product_brand,
          product_model: item.product_model,
          purchase_date: item.purchase_date,
          issue_description: item.issue_description,
        })),
        service_type: payload.items.find((item) => item.service_option)?.service_option ?? "paid",
        preferred_delivery_method: payload.delivery.preferred_delivery_method,
        delivery_address: payload.delivery.delivery_address,
        honeypot: payload.honeypot,
      });

      if (result?.tracking_token) {
        router.push(`/service-request/success?token=${result.tracking_token}`);
      } else {
        router.push("/service-request/success");
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Không thể gửi yêu cầu. Vui lòng thử lại.");
    }
  };

  return (
    <>
      <Button type="button" variant="outline" onClick={goPrev} disabled={state.activeStep === 0}>
        Quay lại
      </Button>
      {state.activeStep < 3 ? (
        <Button type="button" onClick={goNext}>
          Tiếp tục
        </Button>
      ) : (
        <Button type="button" onClick={handleSubmit} disabled={isSubmitting}>
          {isSubmitting ? "Đang gửi..." : "Gửi yêu cầu"}
        </Button>
      )}
    </>
  );
}

function WizardLayout() {
  return (
    <div className="grid gap-8 lg:grid-cols-[280px,1fr]">
      <WizardNavigator />
      <WizardContent />
    </div>
  );
}

export function ServiceRequestWizard() {
  return (
    <ServiceRequestWizardProvider>
      <WizardLayout />
    </ServiceRequestWizardProvider>
  );
}
