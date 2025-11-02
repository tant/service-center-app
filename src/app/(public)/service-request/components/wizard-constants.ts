import type { WizardStep } from "@/hooks/use-service-request-wizard";

export interface WizardStepDefinition {
  id: WizardStep;
  title: string;
  description: string;
}

export const SERVICE_REQUEST_WIZARD_STEPS: WizardStepDefinition[] = [
  {
    id: 0,
    title: "Sản phẩm & vấn đề",
    description: "Thêm sản phẩm và mô tả triệu chứng.",
  },
  {
    id: 1,
    title: "Bảo hành & dịch vụ",
    description: "Kiểm tra bảo hành, chọn phương án xử lý.",
  },
  {
    id: 2,
    title: "Khách hàng & tiếp nhận",
    description: "Thu thập thông tin liên hệ và phương thức.",
  },
  {
    id: 3,
    title: "Xem lại & xác nhận",
    description: "Kiểm tra lần cuối trước khi gửi yêu cầu.",
  },
] satisfies WizardStepDefinition[];

export const SERVICE_REQUEST_PRODUCT_RULES = {
  serialMinLength: 5,
  issueMinLength: 10,
};

export const SERVICE_REQUEST_CONTACT_RULES = {
  nameMinLength: 2,
  emailPattern: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
  phoneDigitsMinLength: 10,
  deliveryAddressMinLength: 10,
};

export const SERVICE_REQUEST_WIZARD_BEHAVIOR = {
  swipeThresholdPx: 60,
};

export const SERVICE_REQUEST_FINAL_STEP: WizardStep = 3;
