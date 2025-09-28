import { router } from "../trpc";
import { adminRouter } from "./admin";
import { profileRouter } from "./profile";

export const appRouter = router({
  admin: adminRouter,
  profile: profileRouter,
});

export type AppRouter = typeof appRouter;
