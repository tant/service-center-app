import { router } from "../trpc";
import { adminRouter } from "./admin";
import { profileRouter } from "./profile";
import { productsRouter } from "./products";

export const appRouter = router({
  admin: adminRouter,
  profile: profileRouter,
  products: productsRouter,
});

export type AppRouter = typeof appRouter;
