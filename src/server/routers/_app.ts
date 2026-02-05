import { router } from "../trpc";
import { adminRouter } from "./admin";
import { analyticsRouter } from "./analytics";
import { appSettingsRouter } from "./app-settings";
import { assignmentsRouter } from "./assignments";
import { brandsRouter } from "./brands";
import { customersRouter } from "./customers";
import { inventoryRouter } from "./inventory";
import { notificationsRouter } from "./notifications";
import { partsRouter } from "./parts";
import { inventoryRouter as physicalProductsRouter } from "./physical-products";
import { productsRouter } from "./products";
import { profileRouter } from "./profile";
import { revenueRouter } from "./revenue";
import { serviceRequestRouter } from "./service-request";
import { tasksRouter } from "./tasks";
import { ticketsRouter } from "./tickets";
import { warehouseRouter } from "./warehouse";
import { workflowRouter } from "./workflow";

export const appRouter = router({
  admin: adminRouter,
  profile: profileRouter,
  products: productsRouter,
  parts: partsRouter,
  customers: customersRouter,
  tickets: ticketsRouter,
  revenue: revenueRouter,
  brands: brandsRouter,
  workflow: workflowRouter,
  warehouse: warehouseRouter,
  inventory: inventoryRouter,
  physicalProducts: physicalProductsRouter,
  serviceRequest: serviceRequestRouter,
  notifications: notificationsRouter,
  tasks: tasksRouter,
  analytics: analyticsRouter,
  assignments: assignmentsRouter,
  appSettings: appSettingsRouter,
});

export type AppRouter = typeof appRouter;
