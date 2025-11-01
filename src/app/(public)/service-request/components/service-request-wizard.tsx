"use client";

import { Fragment } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
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
import { cn } from "@/lib/utils";

const MIN_SERIAL_LENGTH = 5;
const MIN_ISSUE_LENGTH = 10;
const MIN_NAME_LENGTH = 2;
const MIN_PHONE_LENGTH = 10;
const MIN_ADDRESS_LENGTH = 10;
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

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
  const totalSteps = STEP_CONFIG.length;
  const currentStep = STEP_CONFIG[state.activeStep];
  const progressPercent = ((state.activeStep + 1) / totalSteps) * 100;

  const handleStepClick = (stepId: WizardStep) => {
    if (stepId > state.maxVisitedStep) {
      return;
    }
    setActiveStep(dispatch, stepId);
  };

  return (
    <div className="space-y-4">
      <div className="space-y-3 md:hidden">
        <div className="space-y-1">
          <Badge variant="secondary">{`Bước ${state.activeStep + 1}/${totalSteps}`}</Badge>
          <div className="text-base font-semibold">{currentStep.title}</div>
          <p className="text-sm text-muted-foreground">{currentStep.description}</p>
        </div>
        <div className="h-2 w-full rounded-full bg-muted" aria-hidden="true">
          <div
            className="h-full rounded-full bg-primary transition-all"
            style={{ width: `${progressPercent}%` }}
          />
        </div>
        <div className="flex items-stretch gap-2 overflow-x-auto pb-1">
          {STEP_CONFIG.map((step, index) => {
            const isActive = state.activeStep === step.id;
            const isVisited = step.id <= state.maxVisitedStep;
            const isComplete = step.id < state.activeStep;

            return (
              <button
                key={step.id}
                type="button"
                disabled={!isVisited}
                onClick={() => handleStepClick(step.id)}
                aria-current={isActive ? "step" : undefined}
                className={cn(
                  "min-w-[160px] rounded-lg border p-3 text-left transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-60",
                  isActive
                    ? "border-primary bg-primary/10"
                    : isComplete
                    ? "border-primary/40 bg-primary/5"
                    : "border-border/60 bg-muted/40 hover:border-border"
                )}
              >
                <Badge variant={isActive ? "default" : "outline"} className="mb-1">
                  Bước {index + 1}
                </Badge>
                <div className="text-sm font-semibold">{step.title}</div>
                <p className="text-xs text-muted-foreground">{step.description}</p>
              </button>
            );
          })}
        </div>
      </div>

      <div className="hidden md:flex items-center">
        {STEP_CONFIG.map((step, index) => {
          const isActive = state.activeStep === step.id;
          const isVisited = step.id <= state.maxVisitedStep;
          const isComplete = step.id < state.activeStep;

          return (
            <Fragment key={step.id}>
              <button
                type="button"
                disabled={!isVisited}
                onClick={() => handleStepClick(step.id)}
                aria-current={isActive ? "step" : undefined}
                className={cn(
                  "flex min-w-[200px] flex-col gap-1 rounded-xl border p-4 text-left transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-60",
                  isActive
                    ? "border-primary bg-primary/10"
                    : isComplete
                    ? "border-primary/40 bg-primary/5"
                    : "border-border/60 bg-muted/40 hover:border-border"
                )}
              >
                <div className="flex items-center gap-2">
                  <div
                    className={cn(
                      "flex h-9 w-9 items-center justify-center rounded-full border text-sm font-semibold",
                      isActive
                        ? "border-primary bg-primary text-primary-foreground"
                        : isComplete
                        ? "border-primary bg-primary/10 text-primary"
                        : "border-border bg-background text-muted-foreground"
                    )}
                  >
                    {index + 1}
                  </div>
                  <span className="text-sm font-semibold">{step.title}</span>
                </div>
                <p className="text-sm text-muted-foreground">{step.description}</p>
              </button>
              {index < STEP_CONFIG.length - 1 ? (
                <div className="mx-2 flex-1 border-t border-dashed border-border" aria-hidden="true" />
              ) : null}
            </Fragment>
          );
        })}
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
    if (!validateStep(state.activeStep)) {
      return;
    }
    const next = Math.min(3, state.activeStep + 1) as WizardStep;
    setActiveStep(dispatch, next);
  };

  const handleSubmit = async () => {
    if (!validateStep(state.activeStep)) {
      return;
    }
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
        issue_overview: payload.issue_overview,
        items: payload.items,
        preferred_delivery_method: payload.delivery.preferred_delivery_method,
        delivery_address: payload.delivery.delivery_address,
        preferred_schedule: payload.delivery.preferred_schedule,
        pickup_notes: payload.delivery.pickup_notes,
        contact_notes: payload.delivery.contact_notes,
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

  const validateStep = (step: WizardStep): boolean => {
    switch (step) {
      case 0: {
        if (state.products.length === 0) {
          toast.error("Vui lòng thêm ít nhất một sản phẩm.");
          return false;
        }
        const invalidSerial = state.products.find((product) => product.serialNumber.trim().length < MIN_SERIAL_LENGTH);
        if (invalidSerial) {
          toast.error(`Serial phải có tối thiểu ${MIN_SERIAL_LENGTH} ký tự.`);
          return false;
        }
        const invalidIssue = state.products.find((product) => product.issueDescription.trim().length < MIN_ISSUE_LENGTH);
        if (invalidIssue) {
          toast.error(`Mô tả vấn đề cần tối thiểu ${MIN_ISSUE_LENGTH} ký tự.`);
          return false;
        }
        const uploadingAttachment = state.products.some((product) =>
          product.attachments.some((attachment) => attachment.status === "uploading")
        );
        if (uploadingAttachment) {
          toast.error("Đang tải ảnh lên. Vui lòng chờ hoàn tất trước khi tiếp tục.");
          return false;
        }
        return true;
      }
      case 1: {
        const missingServiceOption = state.products.find((product) => !product.serviceOption);
        if (missingServiceOption) {
          toast.error("Vui lòng chọn phương án xử lý cho từng sản phẩm.");
          return false;
        }
        return true;
      }
      case 2: {
        if (state.customer.name.trim().length < MIN_NAME_LENGTH) {
          toast.error("Họ và tên phải có ít nhất 2 ký tự.");
          return false;
        }
        if (!EMAIL_REGEX.test(state.customer.email.trim())) {
          toast.error("Email không hợp lệ.");
          return false;
        }
        const phoneDigits = state.customer.phone.replace(/\D/g, "");
        if (phoneDigits.length < MIN_PHONE_LENGTH) {
          toast.error("Số điện thoại cần tối thiểu 10 chữ số.");
          return false;
        }
        if (
          state.delivery.preferredDeliveryMethod === "delivery" &&
          (state.delivery.deliveryAddress?.trim().length ?? 0) < MIN_ADDRESS_LENGTH
        ) {
          toast.error("Địa chỉ giao nhận cần tối thiểu 10 ký tự.");
          return false;
        }
        return true;
      }
      case 3: {
        if (!state.consentConfirmed) {
          toast.error("Vui lòng xác nhận điều khoản trước khi gửi.");
          return false;
        }
        return true;
      }
      default:
        return true;
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
    <div className="space-y-4">
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
