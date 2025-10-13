import { router } from "../trpc";
import { adminRouter } from "./admin";
import { profileRouter } from "./profile";
import { productsRouter } from "./products";
import { partsRouter } from "./parts";
import { customersRouter } from "./customers";
import { ticketsRouter } from "./tickets";
import { revenueRouter } from "./revenue";
import { brandsRouter } from "./brands";

export const appRouter = router({
  admin: adminRouter,
  profile: profileRouter,
  products: productsRouter,
  parts: partsRouter,
  customers: customersRouter,
  tickets: ticketsRouter,
  revenue: revenueRouter,
  brands: brandsRouter,
});

export type AppRouter = typeof appRouter;
