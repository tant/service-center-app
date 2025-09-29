import { router } from "../trpc";
import { adminRouter } from "./admin";
import { profileRouter } from "./profile";
import { productsRouter } from "./products";
import { partsRouter } from "./parts";

export const appRouter = router({
  admin: adminRouter,
  profile: profileRouter,
  products: productsRouter,
  parts: partsRouter,
});

export type AppRouter = typeof appRouter;
