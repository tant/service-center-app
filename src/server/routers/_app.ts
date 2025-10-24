import { router } from "../trpc";
import { adminRouter } from "./admin";
import { profileRouter } from "./profile";
import { productsRouter } from "./products";
import { partsRouter } from "./parts";
import { customersRouter } from "./customers";
import { ticketsRouter } from "./tickets";
import { revenueRouter } from "./revenue";
import { brandsRouter } from "./brands";
import { workflowRouter } from "./workflow";
import { warehouseRouter } from "./warehouse";
import { inventoryRouter } from "./inventory";

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
});

export type AppRouter = typeof appRouter;
