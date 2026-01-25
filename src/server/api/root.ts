import userRouter from "@/server/api/routers/user";
import tricountRouter from "@/server/api/routers/tricount/tricount";
import tricountInteractionRouter from "@/server/api/routers/tricount/interaction";
import tricountCategoryRouter from "@/server/api/routers/tricount/category";
import pushRouter from "@/server/api/routers/push";
import { createCallerFactory, createTRPCRouter } from "@/server/api/trpc";
import countMonthRouter from "./routers/count/month";
import countInteractionRouter from "./routers/count/interaction";

/**
 * This is the primary router for your server.
 *
 * All routers added in /api/routers should be manually added here.
 */
export const appRouter = createTRPCRouter({
    user: userRouter,

    tricount: tricountRouter,
    tricountInteraction: tricountInteractionRouter,
    tricountCategory: tricountCategoryRouter,

    push: pushRouter,

    countMonth: countMonthRouter,
    countInteraction: countInteractionRouter,
});

// export type definition of API
export type AppRouter = typeof appRouter;

/**
 * Create a server-side caller for the tRPC API.
 * @example
 * const trpc = createCaller(createContext);
 * const res = await trpc.post.all();
 *       ^? Post[]
 */
export const createCaller = createCallerFactory(appRouter);
