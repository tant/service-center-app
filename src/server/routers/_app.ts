import { router } from "../trpc";
import { adminRouter } from "./admin";
import { profileRouter } from "./profile";
import { productsRouter } from "./products";
import { partsRouter } from "./parts";
import { customersRouter } from "./customers";

export const appRouter = router({
  admin: adminRouter,
  profile: profileRouter,
  products: productsRouter,
  parts: partsRouter,
  customers: customersRouter,
});

export type AppRouter = typeof appRouter;
