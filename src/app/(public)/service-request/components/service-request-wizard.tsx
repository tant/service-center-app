"use client";

import { useRouter } from "next/navigation";
import { Fragment, useRef } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { useSubmitServiceRequest } from "@/hooks/use-service-request";
import type {
  ServiceRequestWizardState,
  WizardStep,
} from "@/hooks/use-service-request-wizard";
import {
  buildWizardPayload,
  ServiceRequestWizardProvider,
  setActiveStep,
  useServiceRequestWizardDispatch,
  useServiceRequestWizardState,
} from "@/hooks/use-service-request-wizard";
import { cn } from "@/lib/utils";
import { StepCustomer, StepProducts, StepReview, StepSolutions } from "./steps";
import {
  SERVICE_REQUEST_CONTACT_RULES,
  SERVICE_REQUEST_FINAL_STEP,
  SERVICE_REQUEST_PRODUCT_RULES,
  SERVICE_REQUEST_WIZARD_BEHAVIOR,
  SERVICE_REQUEST_WIZARD_STEPS,
} from "./wizard-constants";

const PRODUCT_RULES = SERVICE_REQUEST_PRODUCT_RULES;
const CONTACT_RULES = SERVICE_REQUEST_CONTACT_RULES;
const WIZARD_STEPS = SERVICE_REQUEST_WIZARD_STEPS;
const FINAL_STEP = SERVICE_REQUEST_FINAL_STEP;
const SWIPE_THRESHOLD_PX = SERVICE_REQUEST_WIZARD_BEHAVIOR.swipeThresholdPx;

const STEP_COMPONENT_MAP: Record<WizardStep, React.ComponentType> = {
  0: StepProducts,
  1: StepSolutions,
  2: StepCustomer,
  3: StepReview,
};

function validateWizardStep(
  state: ServiceRequestWizardState,
  step: WizardStep,
): boolean {
  switch (step) {
    case 0: {
      if (state.products.length === 0) {
        toast.error("Vui lòng thêm ít nhất một sản phẩm.");
        return false;
      }
      const invalidSerial = state.products.find(
        (product) =>
          product.serialNumber.trim().length < PRODUCT_RULES.serialMinLength,
      );
      if (invalidSerial) {
        toast.error(
          `Serial phải có tối thiểu ${PRODUCT_RULES.serialMinLength} ký tự.`,
        );
        return false;
      }
      const invalidIssue = state.products.find(
        (product) =>
          product.issueDescription.trim().length < PRODUCT_RULES.issueMinLength,
      );
      if (invalidIssue) {
        toast.error(
          `Mô tả vấn đề cần tối thiểu ${PRODUCT_RULES.issueMinLength} ký tự.`,
        );
        return false;
      }
      const uploadingAttachment = state.products.some((product) =>
        product.attachments.some(
          (attachment) => attachment.status === "uploading",
        ),
      );
      if (uploadingAttachment) {
        toast.error(
          "Đang tải ảnh lên. Vui lòng chờ hoàn tất trước khi tiếp tục.",
        );
        return false;
      }
      return true;
    }
    case 1: {
      const missingServiceOption = state.products.find(
        (product) => !product.serviceOption,
      );
      if (missingServiceOption) {
        toast.error("Vui lòng chọn phương án xử lý cho từng sản phẩm.");
        return false;
      }
      const serialNotFound = state.products.find(
        (product) => product.warrantyCheck.notFound,
      );
      if (serialNotFound) {
        const serial = serialNotFound.serialNumber || "chưa có serial";
        toast.error(
          `Serial ${serial} chưa khớp với dữ liệu bảo hành. Vui lòng kiểm tra lại ở bước trước.`,
        );
        return false;
      }
      return true;
    }
    case 2: {
      if (state.customer.name.trim().length < CONTACT_RULES.nameMinLength) {
        toast.error("Họ và tên phải có ít nhất 2 ký tự.");
        return false;
      }
      if (!CONTACT_RULES.emailPattern.test(state.customer.email.trim())) {
        toast.error("Email không hợp lệ.");
        return false;
      }
      const phoneDigits = state.customer.phone.replace(/\D/g, "");
      if (phoneDigits.length < CONTACT_RULES.phoneDigitsMinLength) {
        toast.error("Số điện thoại cần tối thiểu 10 chữ số.");
        return false;
      }
      if (
        state.delivery.preferredDeliveryMethod === "delivery" &&
        (state.delivery.deliveryAddress?.trim().length ?? 0) <
          CONTACT_RULES.deliveryAddressMinLength
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
}

function WizardNavigator() {
  const state = useServiceRequestWizardState();
  const dispatch = useServiceRequestWizardDispatch();

  const handleStepClick = (stepId: WizardStep) => {
    if (stepId > state.maxVisitedStep) {
      return;
    }
    setActiveStep(dispatch, stepId);
  };

  return (
    <div className="space-y-4">
      <div className="space-y-4 md:hidden">
        <div className="flex items-start gap-1 px-3">
          {WIZARD_STEPS.map((step, index) => {
            const isActive = state.activeStep === step.id;
            const isVisited = step.id <= state.maxVisitedStep;
            const isComplete = step.id < state.activeStep;
            return (
              <Fragment key={step.id}>
                <div className="flex min-w-[72px] flex-col items-center text-center">
                  <button
                    type="button"
                    disabled={!isVisited}
                    onClick={() => handleStepClick(step.id)}
                    aria-current={isActive ? "step" : undefined}
                    className={cn(
                      "flex h-10 w-10 items-center justify-center rounded-full border text-sm font-semibold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50",
                      isActive
                        ? "border-primary bg-primary text-primary-foreground shadow-sm"
                        : isComplete
                          ? "border-primary bg-primary/15 text-primary"
                          : isVisited
                            ? "border-primary/70 text-primary"
                            : "border-border bg-background text-muted-foreground",
                    )}
                  >
                    {index + 1}
                  </button>
                  <span
                    className={cn(
                      "mt-2 text-xs leading-tight text-muted-foreground",
                      (isActive || isComplete) && "font-semibold",
                      isActive
                        ? "text-foreground"
                        : isComplete
                          ? "text-primary"
                          : undefined,
                    )}
                  >
                    {step.title}
                  </span>
                </div>
                {index < WIZARD_STEPS.length - 1 ? (
                  <div
                    className={cn(
                      "flex-1 h-px mt-5 rounded-full",
                      state.maxVisitedStep >= step.id + 1
                        ? "bg-primary"
                        : "bg-muted-foreground/30",
                    )}
                    aria-hidden="true"
                  />
                ) : null}
              </Fragment>
            );
          })}
        </div>
      </div>

      <div className="hidden md:flex items-center">
        {WIZARD_STEPS.map((step, index) => {
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
                      : "border-border/60 bg-muted/40 hover:border-border",
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
                          : "border-border bg-background text-muted-foreground",
                    )}
                  >
                    {index + 1}
                  </div>
                  <span className="text-sm font-semibold">{step.title}</span>
                </div>
                <p className="text-sm text-muted-foreground">
                  {step.description}
                </p>
              </button>
              {index < WIZARD_STEPS.length - 1 ? (
                <div
                  className="mx-2 flex-1 border-t border-dashed border-border"
                  aria-hidden="true"
                />
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
  const dispatch = useServiceRequestWizardDispatch();
  const StepComponent = STEP_COMPONENT_MAP[state.activeStep];
  const touchStart = useRef<{ x: number; y: number } | null>(null);

  const handleSwipe = (direction: "next" | "prev") => {
    if (direction === "next") {
      const next = Math.min(
        WIZARD_STEPS.length - 1,
        state.activeStep + 1,
      ) as WizardStep;
      if (
        next !== state.activeStep &&
        validateWizardStep(state, state.activeStep)
      ) {
        setActiveStep(dispatch, next);
      }
    } else {
      const prev = Math.max(0, state.activeStep - 1) as WizardStep;
      if (prev !== state.activeStep) {
        setActiveStep(dispatch, prev);
      }
    }
  };

  const handleTouchStart: React.TouchEventHandler<HTMLDivElement> = (event) => {
    const touch = event.touches[0];
    touchStart.current = { x: touch.clientX, y: touch.clientY };
  };

  const handleTouchEnd: React.TouchEventHandler<HTMLDivElement> = (event) => {
    if (!touchStart.current) {
      return;
    }
    const touch = event.changedTouches[0];
    const deltaX = touch.clientX - touchStart.current.x;
    const deltaY = touch.clientY - touchStart.current.y;
    touchStart.current = null;

    if (
      Math.abs(deltaX) < SWIPE_THRESHOLD_PX ||
      Math.abs(deltaX) <= Math.abs(deltaY)
    ) {
      return;
    }

    if (deltaX < 0) {
      handleSwipe("next");
    } else {
      handleSwipe("prev");
    }
  };

  return (
    <div className="space-y-4">
      <div
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
        role="presentation"
        className="touch-pan-y"
      >
        <StepComponent />
      </div>
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
    if (!validateWizardStep(state, state.activeStep)) {
      return;
    }
    const next = Math.min(FINAL_STEP, state.activeStep + 1) as WizardStep;
    setActiveStep(dispatch, next);
  };

  const handleSubmit = async () => {
    if (!validateWizardStep(state, state.activeStep)) {
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

    if (
      payload.delivery.preferred_delivery_method === "delivery" &&
      !payload.delivery.delivery_address
    ) {
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
      toast.error(
        error instanceof Error
          ? error.message
          : "Không thể gửi yêu cầu. Vui lòng thử lại.",
      );
    }
  };

  return (
    <>
      <Button
        type="button"
        variant="outline"
        onClick={goPrev}
        disabled={state.activeStep === 0}
      >
        Quay lại
      </Button>
      {state.activeStep < FINAL_STEP ? (
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
