import { router } from "../trpc";
import { adminRouter } from "./admin";
import { profileRouter } from "./profile";
import { productsRouter } from "./products";
import { partsRouter } from "./parts";
import { customersRouter } from "./customers";
import { ticketsRouter } from "./tickets";

export const appRouter = router({
  admin: adminRouter,
  profile: profileRouter,
  products: productsRouter,
  parts: partsRouter,
  customers: customersRouter,
  tickets: ticketsRouter,
});

export type AppRouter = typeof appRouter;
