// Service Request Wizard State Management
// Provides context, reducer, and helpers for the public service request flow.

import { createContext, useContext, useMemo, useReducer } from "react";
import type { DeliveryMethod, ServiceType } from "@/types/enums";

const MIN_SERIAL_LENGTH = 5;

export const MAX_PRODUCTS = 10;
export const MAX_ATTACHMENTS_PER_PRODUCT = 5;
export const MAX_ATTACHMENT_SIZE_BYTES = 10 * 1024 * 1024; // 10 MiB

export type WizardStep = 0 | 1 | 2 | 3;

export interface WizardProductAttachment {
  id: string;
  fileName: string;
  size: number;
  type: string;
  status: "idle" | "uploading" | "uploaded" | "error";
  progress: number;
  path?: string;
  previewUrl?: string;
  errorMessage?: string;
}

export interface WizardWarrantyCheck {
  status: "idle" | "pending" | "success" | "error";
  eligible?: boolean;
  message?: string;
  expiresAt?: string;
}

export interface WizardProduct {
  id: string;
  serialNumber: string;
  productBrand?: string;
  productModel?: string;
  purchaseDate?: string;
  issueDescription: string;
  warrantyCheck: WizardWarrantyCheck;
  warrantyRequested: boolean;
  serviceOption?: ServiceType;
  serviceOptionNotes?: string;
  attachments: WizardProductAttachment[];
}

export interface WizardCustomer {
  name: string;
  email: string;
  phone: string;
  address?: string;
}

export interface WizardDelivery {
  preferredDeliveryMethod: DeliveryMethod;
  deliveryAddress?: string;
  preferredSchedule?: string;
  pickupNotes?: string;
  contactNotes?: string;
}

export interface ServiceRequestWizardState {
  activeStep: WizardStep;
  maxVisitedStep: WizardStep;
  products: WizardProduct[];
  requestIssueOverview: string;
  customer: WizardCustomer;
  delivery: WizardDelivery;
  consentConfirmed: boolean;
  honeypot: string;
}

export interface WizardSubmitProductPayload {
  serial_number: string;
  product_brand?: string;
  product_model?: string;
  purchase_date?: string;
  issue_description?: string;
  warranty_requested: boolean;
  service_option: ServiceType;
  service_option_notes?: string;
  attachments: Array<{
    path: string;
    file_name: string;
    file_size: number;
    file_type: string;
  }>;
}

export interface WizardSubmitPayload {
  customer: {
    name: string;
    email: string;
    phone: string;
    address?: string;
  };
  delivery: {
    preferred_delivery_method: DeliveryMethod;
    delivery_address?: string;
    preferred_schedule?: string;
    pickup_notes?: string;
    contact_notes?: string;
  };
  issue_overview?: string;
  items: WizardSubmitProductPayload[];
  consent_confirmed: boolean;
  honeypot?: string;
}

type WizardAction =
  | { type: "SET_ACTIVE_STEP"; step: WizardStep }
  | { type: "RESET" }
  | { type: "SET_CONSENT"; consent: boolean }
  | { type: "SET_HONEYPOT"; value: string }
  | { type: "SET_REQUEST_ISSUE_OVERVIEW"; overview: string }
  | { type: "SET_CUSTOMER"; customer: WizardCustomer }
  | { type: "SET_DELIVERY"; delivery: WizardDelivery }
  | { type: "ADD_PRODUCT"; product: WizardProduct }
  | { type: "UPDATE_PRODUCT"; productId: string; updates: Partial<WizardProduct> }
  | { type: "PATCH_PRODUCT"; productId: string; updater: (product: WizardProduct) => WizardProduct }
  | { type: "REMOVE_PRODUCT"; productId: string }
  | { type: "REPLACE_PRODUCTS"; products: WizardProduct[] };

const createInitialCustomer = (): WizardCustomer => ({
  name: "",
  email: "",
  phone: "",
});

const createInitialDelivery = (): WizardDelivery => ({
  preferredDeliveryMethod: "pickup",
  deliveryAddress: "",
  preferredSchedule: "",
  pickupNotes: "",
  contactNotes: "",
});

const createInitialState = (): ServiceRequestWizardState => ({
  activeStep: 0,
  maxVisitedStep: 0,
  products: [],
  requestIssueOverview: "",
  customer: createInitialCustomer(),
  delivery: createInitialDelivery(),
  consentConfirmed: false,
  honeypot: "",
});

const WizardStateContext = createContext<ServiceRequestWizardState | undefined>(undefined);
const WizardDispatchContext = createContext<React.Dispatch<WizardAction> | undefined>(undefined);

function wizardReducer(state: ServiceRequestWizardState, action: WizardAction): ServiceRequestWizardState {
  switch (action.type) {
    case "SET_ACTIVE_STEP":
      return {
        ...state,
        activeStep: action.step,
        maxVisitedStep: (action.step > state.maxVisitedStep ? action.step : state.maxVisitedStep) as WizardStep,
      };
    case "RESET":
      return createInitialState();
    case "SET_CONSENT":
      return { ...state, consentConfirmed: action.consent };
    case "SET_HONEYPOT":
      return { ...state, honeypot: action.value };
    case "SET_REQUEST_ISSUE_OVERVIEW":
      return { ...state, requestIssueOverview: action.overview };
    case "SET_CUSTOMER":
      return { ...state, customer: { ...action.customer } };
    case "SET_DELIVERY":
      return { ...state, delivery: { ...action.delivery } };
    case "ADD_PRODUCT":
      if (state.products.length >= MAX_PRODUCTS) {
        return state;
      }
      return { ...state, products: [...state.products, action.product] };
    case "UPDATE_PRODUCT":
      return {
        ...state,
        products: state.products.map((product) =>
          product.id === action.productId ? { ...product, ...action.updates } : product
        ),
      };
    case "PATCH_PRODUCT":
      return {
        ...state,
        products: state.products.map((product) =>
          product.id === action.productId ? action.updater(product) : product
        ),
      };
    case "REMOVE_PRODUCT": {
      const filtered = state.products.filter((product) => product.id !== action.productId);
      return { ...state, products: filtered };
    }
    case "REPLACE_PRODUCTS":
      return { ...state, products: [...action.products] };
    default:
      return state;
  }
}

export function ServiceRequestWizardProvider(props: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(wizardReducer, undefined, createInitialState);

  const value = useMemo(() => state, [state]);

  return (
    <WizardStateContext.Provider value={value}>
      <WizardDispatchContext.Provider value={dispatch}>{props.children}</WizardDispatchContext.Provider>
    </WizardStateContext.Provider>
  );
}

export function useServiceRequestWizardState() {
  const context = useContext(WizardStateContext);
  if (!context) {
    throw new Error("useServiceRequestWizardState must be used within ServiceRequestWizardProvider");
  }
  return context;
}

export function useServiceRequestWizardDispatch() {
  const context = useContext(WizardDispatchContext);
  if (!context) {
    throw new Error("useServiceRequestWizardDispatch must be used within ServiceRequestWizardProvider");
  }
  return context;
}

const generateId = () =>
  typeof crypto !== "undefined" && typeof crypto.randomUUID === "function"
    ? crypto.randomUUID()
    : `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;

export function createEmptyWizardProduct(): WizardProduct {
  return {
    id: generateId(),
    serialNumber: "",
    productBrand: "",
    productModel: "",
    purchaseDate: "",
    issueDescription: "",
    warrantyCheck: { status: "idle" },
    warrantyRequested: false,
    attachments: [],
  };
}

export function resetWizard(dispatch: React.Dispatch<WizardAction>) {
  dispatch({ type: "RESET" });
}

export function setActiveStep(dispatch: React.Dispatch<WizardAction>, step: WizardStep) {
  dispatch({ type: "SET_ACTIVE_STEP", step });
}

export function addWizardProduct(dispatch: React.Dispatch<WizardAction>, product?: WizardProduct) {
  dispatch({ type: "ADD_PRODUCT", product: product ?? createEmptyWizardProduct() });
}

export function updateWizardProduct(
  dispatch: React.Dispatch<WizardAction>,
  productId: string,
  updates: Partial<WizardProduct>
) {
  dispatch({ type: "UPDATE_PRODUCT", productId, updates });
}

export function patchWizardProduct(
  dispatch: React.Dispatch<WizardAction>,
  productId: string,
  updater: (product: WizardProduct) => WizardProduct
) {
  dispatch({ type: "PATCH_PRODUCT", productId, updater });
}

export function removeWizardProduct(dispatch: React.Dispatch<WizardAction>, productId: string) {
  dispatch({ type: "REMOVE_PRODUCT", productId });
}

export function setWizardCustomer(dispatch: React.Dispatch<WizardAction>, customer: WizardCustomer) {
  dispatch({ type: "SET_CUSTOMER", customer });
}

export function setWizardDelivery(dispatch: React.Dispatch<WizardAction>, delivery: WizardDelivery) {
  dispatch({ type: "SET_DELIVERY", delivery });
}

export function setWizardIssueOverview(dispatch: React.Dispatch<WizardAction>, overview: string) {
  dispatch({ type: "SET_REQUEST_ISSUE_OVERVIEW", overview });
}

export function setWizardConsent(dispatch: React.Dispatch<WizardAction>, consent: boolean) {
  dispatch({ type: "SET_CONSENT", consent });
}

export function setWizardHoneypot(dispatch: React.Dispatch<WizardAction>, value: string) {
  dispatch({ type: "SET_HONEYPOT", value });
}

export function buildWizardPayload(state: ServiceRequestWizardState): WizardSubmitPayload {
  const sanitizedItems: WizardSubmitProductPayload[] = state.products
    .filter((product) => product.serialNumber.trim().length >= MIN_SERIAL_LENGTH)
    .map((product) => {
      return {
        serial_number: product.serialNumber.trim().toUpperCase(),
        product_brand: product.productBrand?.trim() || undefined,
        product_model: product.productModel?.trim() || undefined,
        purchase_date: product.purchaseDate?.trim() || undefined,
        issue_description: product.issueDescription.trim().length > 0 ? product.issueDescription.trim() : undefined,
        warranty_requested: product.warrantyRequested,
        service_option: (product.serviceOption ?? "paid") as ServiceType,
        service_option_notes: product.serviceOptionNotes?.trim() || undefined,
        attachments: product.attachments
          .filter((attachment) => attachment.status === "uploaded" && attachment.path)
          .map((attachment) => ({
            path: attachment.path!,
            file_name: attachment.fileName,
            file_size: attachment.size,
            file_type: attachment.type,
          })),
      };
    });

  const payload: WizardSubmitPayload = {
    customer: {
      name: state.customer.name.trim(),
      email: state.customer.email.trim().toLowerCase(),
      phone: state.customer.phone.trim(),
      address: state.customer.address?.trim() || undefined,
    },
    delivery: {
      preferred_delivery_method: state.delivery.preferredDeliveryMethod,
      delivery_address:
        state.delivery.preferredDeliveryMethod === "delivery"
          ? state.delivery.deliveryAddress?.trim() || undefined
          : undefined,
      preferred_schedule: state.delivery.preferredSchedule?.trim() || undefined,
      pickup_notes:
        state.delivery.preferredDeliveryMethod === "pickup"
          ? state.delivery.pickupNotes?.trim() || undefined
          : undefined,
      contact_notes: state.delivery.contactNotes?.trim() || undefined,
    },
    issue_overview: state.requestIssueOverview.trim() || undefined,
    items: sanitizedItems,
    consent_confirmed: state.consentConfirmed,
    honeypot: state.honeypot || undefined,
  };

  return payload;
}
