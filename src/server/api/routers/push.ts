import z from "zod";
import { createTRPCRouter, publicProcedure, type createTRPCContext } from "@/server/api/trpc";
import { pushSubscriptions, tri_users, tri } from "@/server/db/schema";
import { and, eq, inArray, ne } from "drizzle-orm";
import { getUserIfExist } from "./user";
import { sendPushNotification, isSubscriptionExpired } from "@/lib/web-push";
import { getCloudflareContext } from "@opennextjs/cloudflare";

interface VapidKeys {
    publicKey: string;
    privateKey: string;
    subject: string;
}

// Helper to get VAPID keys from Cloudflare secrets
function getVapidKeys(): VapidKeys {
    const env = getCloudflareContext().env as {
        VAPID_PUBLIC_KEY?: string;
        VAPID_PRIVATE_KEY?: string;
        VAPID_SUBJECT?: string;
    };

    if (!env.VAPID_PUBLIC_KEY || !env.VAPID_PRIVATE_KEY || !env.VAPID_SUBJECT) {
        throw new Error("VAPID keys not configured");
    }

    return {
        publicKey: env.VAPID_PUBLIC_KEY,
        privateKey: env.VAPID_PRIVATE_KEY,
        subject: env.VAPID_SUBJECT,
    };
}

// Helper to get just the public key (for client-side)
export function getVapidPublicKey(): string | null {
    try {
        const env = getCloudflareContext().env as {
            VAPID_PUBLIC_KEY?: string;
        };
        return env.VAPID_PUBLIC_KEY ?? null;
    } catch {
        return null;
    }
}

// Helper function to send notifications to users
export async function sendNotificationToUsers(
    ctx: Awaited<ReturnType<typeof createTRPCContext>>,
    usernames: string[],
    payload: { title: string; body: string; url?: string; tag?: string }
) {
    if (usernames.length === 0) return;

    // Get all subscriptions for these users
    const subscriptions = await ctx.db
        .select()
        .from(pushSubscriptions)
        .where(inArray(pushSubscriptions.username, usernames));

    if (subscriptions.length === 0) return;

    const vapidKeys = getVapidKeys();
    const expiredEndpoints: string[] = [];

    // Send notifications in parallel
    await Promise.all(
        subscriptions.map(async (sub) => {
            const result = await sendPushNotification(
                {
                    endpoint: sub.endpoint,
                    p256dh: sub.p256dh,
                    auth: sub.auth,
                },
                payload,
                vapidKeys
            );

            // Track expired subscriptions
            if (isSubscriptionExpired(result.statusCode)) {
                expiredEndpoints.push(sub.endpoint);
            }
        })
    );

    // Clean up expired subscriptions
    if (expiredEndpoints.length > 0) {
        await ctx.db
            .delete(pushSubscriptions)
            .where(inArray(pushSubscriptions.endpoint, expiredEndpoints));
    }
}

// Helper function to send notifications to other tricount members
export async function sendNotificationToTricountMembers(
    ctx: Awaited<ReturnType<typeof createTRPCContext>>,
    tricountId: number,
    excludeUsername: string,
    payload: { title: string; body: string; url?: string; tag?: string }
) {
    // Get all users in this tricount except the one who triggered the action
    const members = await ctx.db
        .select({ username: tri_users.username })
        .from(tri_users)
        .where(
            and(
                eq(tri_users.idTri, tricountId),
                ne(tri_users.username, excludeUsername)
            )
        );

    const usernames = members.map((m) => m.username);
    await sendNotificationToUsers(ctx, usernames, payload);
}

// Helper to format amount in euros
export function formatAmountEuro(amountInCents: number): string {
    return (amountInCents / 100).toFixed(2).replace(".", ",") + " €";
}

// Helper to get tricount name
export async function getTricountName(
    ctx: Awaited<ReturnType<typeof createTRPCContext>>,
    tricountId: number
): Promise<string> {
    const tricountData = await ctx.db
        .select({ name: tri.name })
        .from(tri)
        .where(eq(tri.id, tricountId))
        .limit(1);

    return tricountData[0]?.name ?? "Tricount";
}

type InteractionAction = "added" | "updated" | "deleted" | "refunded";

// Helper function to send interaction notifications to tricount members
export async function notifyTricountInteraction(
    ctx: Awaited<ReturnType<typeof createTRPCContext>>,
    options: {
        tricountId: number;
        username: string;
        interactionName: string;
        amountInCents: number;
        action: InteractionAction;
    }
) {
    const { tricountId, username, interactionName, amountInCents, action } = options;

    const actionMessages: Record<InteractionAction, string> = {
        added: "a ajouté",
        updated: "a modifié",
        deleted: "a supprimé",
        refunded: "a marqué comme remboursé",
    };

    const tricountName = await getTricountName(ctx, tricountId);
    const amountFormatted = formatAmountEuro(amountInCents);
    const actionText = actionMessages[action];

    await sendNotificationToTricountMembers(ctx, tricountId, username, {
        title: tricountName,
        body: `${username} ${actionText} "${interactionName}" (${amountFormatted})`,
        url: `/tricount/${tricountId}`,
        tag: `tricount-${tricountId}-interaction`,
    });
}

const pushRouter = createTRPCRouter({
    // Get the VAPID public key (needed by the client)
    getVapidPublicKey: publicProcedure.query(() => {
        return getVapidPublicKey();
    }),

    // Test notification - send a test push to the current user
    sendTest: publicProcedure
        .input(
            z.object({
                token: z.string(),
            })
        )
        .mutation(async ({ ctx, input }) => {
            const user = await getUserIfExist(ctx, input.token);

            // Get user's subscriptions
            const subscriptions = await ctx.db
                .select()
                .from(pushSubscriptions)
                .where(eq(pushSubscriptions.username, user.username));

            if (subscriptions.length === 0) {
                return { success: false, error: "No subscriptions found", subscriptionCount: 0 };
            }

            const vapidKeys = getVapidKeys();
            const results: Array<{ endpoint: string; success: boolean; statusCode: number; error?: string }> = [];

            for (const sub of subscriptions) {
                const result = await sendPushNotification(
                    {
                        endpoint: sub.endpoint,
                        p256dh: sub.p256dh,
                        auth: sub.auth,
                    },
                    {
                        title: "Test notification",
                        body: `Ça marche ! 🎉 (${new Date().toLocaleTimeString()})`,
                        url: "/tricount",
                        tag: "test",
                    },
                    vapidKeys
                );
                results.push({ endpoint: sub.endpoint.slice(0, 50) + "...", ...result });
            }

            return {
                success: results.every((r) => r.success),
                subscriptionCount: subscriptions.length,
                results,
            };
        }),

    // Subscribe to push notifications
    subscribe: publicProcedure
        .input(
            z.object({
                token: z.string(),
                endpoint: z.string(),
                p256dh: z.string(),
                auth: z.string(),
            })
        )
        .mutation(async ({ ctx, input }) => {
            const user = await getUserIfExist(ctx, input.token);

            // Check if subscription already exists
            const existing = await ctx.db
                .select()
                .from(pushSubscriptions)
                .where(eq(pushSubscriptions.endpoint, input.endpoint))
                .limit(1);

            if (existing.length > 0) {
                // Update existing subscription (might be a different user or refreshed keys)
                await ctx.db
                    .update(pushSubscriptions)
                    .set({
                        username: user.username,
                        p256dh: input.p256dh,
                        auth: input.auth,
                    })
                    .where(eq(pushSubscriptions.endpoint, input.endpoint));
            } else {
                // Create new subscription
                await ctx.db.insert(pushSubscriptions).values({
                    username: user.username,
                    endpoint: input.endpoint,
                    p256dh: input.p256dh,
                    auth: input.auth,
                });
            }

            return { success: true };
        }),

    // Unsubscribe from push notifications
    unsubscribe: publicProcedure
        .input(
            z.object({
                token: z.string(),
                endpoint: z.string(),
            })
        )
        .mutation(async ({ ctx, input }) => {
            const user = await getUserIfExist(ctx, input.token);

            await ctx.db
                .delete(pushSubscriptions)
                .where(
                    and(
                        eq(pushSubscriptions.endpoint, input.endpoint),
                        eq(pushSubscriptions.username, user.username)
                    )
                );

            return { success: true };
        }),

    // Check if user is subscribed
    getStatus: publicProcedure
        .input(
            z.object({
                token: z.string(),
            })
        )
        .query(async ({ ctx, input }) => {
            const user = await getUserIfExist(ctx, input.token);

            const subscriptions = await ctx.db
                .select()
                .from(pushSubscriptions)
                .where(eq(pushSubscriptions.username, user.username));

            return {
                isSubscribed: subscriptions.length > 0,
                subscriptionCount: subscriptions.length,
            };
        }),

    // Get tricount name (helper for notifications)
    getTricountName: publicProcedure
        .input(
            z.object({
                idTri: z.number(),
            })
        )
        .query(async ({ ctx, input }) => {
            const result = await ctx.db
                .select({ name: tri.name })
                .from(tri)
                .where(eq(tri.id, input.idTri))
                .limit(1);

            return result[0]?.name ?? "Tricount";
        }),
});

export default pushRouter;
