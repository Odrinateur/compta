"use client";

import { useState, useEffect, useCallback } from "react";
import { api } from "@/trpc/react";
import { Button } from "./ui/button";
import { Bell, BellOff, Loader2 } from "lucide-react";
import { type MeUser } from "@/server/db/types";

interface PushNotificationToggleProps {
    user: MeUser;
}

type PushState =
    | "loading"
    | "unsupported"
    | "denied"
    | "prompt"
    | "subscribed"
    | "unsubscribed";

function urlBase64ToUint8Array(base64String: string): ArrayBuffer {
    const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
    const base64 = (base64String + padding)
        .replace(/-/g, "+")
        .replace(/_/g, "/");
    const rawData = atob(base64);
    const outputArray = new Uint8Array(rawData.length);
    for (let i = 0; i < rawData.length; ++i) {
        outputArray[i] = rawData.charCodeAt(i);
    }
    // Return ArrayBuffer to satisfy the applicationServerKey type
    return outputArray.buffer.slice(
        outputArray.byteOffset,
        outputArray.byteOffset + outputArray.byteLength
    );
}

export function PushNotificationToggle({ user }: PushNotificationToggleProps) {
    const [state, setState] = useState<PushState>("loading");
    const [isProcessing, setIsProcessing] = useState(false);

    const vapidKeyQuery = api.push.getVapidPublicKey.useQuery();
    const statusQuery = api.push.getStatus.useQuery({ token: user.token });
    const subscribeMutation = api.push.subscribe.useMutation();
    const unsubscribeMutation = api.push.unsubscribe.useMutation();
    const utils = api.useUtils();

    // Check push support and current state
    useEffect(() => {
        const checkSupport = async () => {
            // Check if running in browser
            if (typeof window === "undefined") {
                setState("unsupported");
                return;
            }

            // Check if Service Worker and Push are supported
            if (!("serviceWorker" in navigator) || !("PushManager" in window)) {
                setState("unsupported");
                return;
            }

            // Check if running as installed PWA on iOS
            const isStandalone =
                window.matchMedia("(display-mode: standalone)").matches ||
                ("standalone" in navigator &&
                    (navigator as { standalone?: boolean }).standalone ===
                        true);

            // On iOS, push notifications only work in standalone mode
            const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
            if (isIOS && !isStandalone) {
                setState("unsupported");
                return;
            }

            // Check notification permission
            const permission = Notification.permission;
            if (permission === "denied") {
                setState("denied");
                return;
            }

            // Wait for status query to complete
            if (!statusQuery.data) {
                return;
            }

            if (statusQuery.data.isSubscribed) {
                setState("subscribed");
            } else if (permission === "granted") {
                setState("unsubscribed");
            } else {
                setState("prompt");
            }
        };

        checkSupport();
    }, [statusQuery.data]);

    const registerServiceWorker =
        useCallback(async (): Promise<ServiceWorkerRegistration | null> => {
            try {
                const registration =
                    await navigator.serviceWorker.register("/sw.js");
                await navigator.serviceWorker.ready;
                return registration;
            } catch (error) {
                console.error("Service Worker registration failed:", error);
                return null;
            }
        }, []);

    const subscribe = useCallback(async () => {
        if (!vapidKeyQuery.data) {
            console.error("VAPID public key not available");
            return;
        }

        setIsProcessing(true);

        try {
            // Register service worker
            const registration = await registerServiceWorker();
            if (!registration) {
                throw new Error("Failed to register service worker");
            }

            // Request notification permission
            const permission = await Notification.requestPermission();
            if (permission !== "granted") {
                setState("denied");
                return;
            }

            // Subscribe to push
            const subscription = await registration.pushManager.subscribe({
                userVisibleOnly: true,
                applicationServerKey: urlBase64ToUint8Array(vapidKeyQuery.data),
            });

            const json = subscription.toJSON();
            if (!json.endpoint || !json.keys?.p256dh || !json.keys?.auth) {
                throw new Error("Invalid subscription");
            }

            // Save to server
            await subscribeMutation.mutateAsync({
                token: user.token,
                endpoint: json.endpoint,
                p256dh: json.keys.p256dh,
                auth: json.keys.auth,
            });

            await utils.push.getStatus.invalidate({ token: user.token });
            setState("subscribed");
        } catch (error) {
            console.error("Failed to subscribe:", error);
        } finally {
            setIsProcessing(false);
        }
    }, [
        vapidKeyQuery.data,
        registerServiceWorker,
        subscribeMutation,
        user.token,
        utils.push.getStatus,
    ]);

    const unsubscribe = useCallback(async () => {
        setIsProcessing(true);

        try {
            const registration = await navigator.serviceWorker.ready;
            const subscription =
                await registration.pushManager.getSubscription();

            if (subscription) {
                const endpoint = subscription.endpoint;

                // Unsubscribe from push manager
                await subscription.unsubscribe();

                // Remove from server
                await unsubscribeMutation.mutateAsync({
                    token: user.token,
                    endpoint,
                });
            }

            await utils.push.getStatus.invalidate({ token: user.token });
            setState("unsubscribed");
        } catch (error) {
            console.error("Failed to unsubscribe:", error);
        } finally {
            setIsProcessing(false);
        }
    }, [unsubscribeMutation, user.token, utils.push.getStatus]);

    // Don't render anything if unsupported
    if (state === "unsupported") {
        return null;
    }

    // Loading state
    if (
        state === "loading" ||
        vapidKeyQuery.isLoading ||
        statusQuery.isLoading
    ) {
        return (
            <Button variant="outline" size="icon" disabled>
                <Loader2 className="h-4 w-4 animate-spin" />
            </Button>
        );
    }

    // Denied state
    if (state === "denied") {
        return (
            <Button
                variant="outline"
                size="icon"
                disabled
                title="Notifications bloquées dans les paramètres"
            >
                <BellOff className="h-4 w-4" />
            </Button>
        );
    }

    // Subscribed state
    if (state === "subscribed") {
        return (
            <div className="flex gap-1">
                <Button
                    variant="outline"
                    size="icon"
                    onClick={unsubscribe}
                    disabled={isProcessing}
                    title="Désactiver les notifications"
                >
                    {isProcessing ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                        <Bell className="text-primary h-4 w-4" />
                    )}
                </Button>
            </div>
        );
    }

    // Prompt or unsubscribed state
    return (
        <Button
            variant="outline"
            size="icon"
            onClick={subscribe}
            disabled={isProcessing}
            title="Activer les notifications"
        >
            {isProcessing ? (
                <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
                <BellOff className="h-4 w-4" />
            )}
        </Button>
    );
}
