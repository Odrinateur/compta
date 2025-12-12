"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { ensureUserSession } from "@/app/actions";

export function UserInitializer() {
    const router = useRouter();

    useEffect(() => {
        const init = async () => {
            await ensureUserSession();
            router.refresh();
        };
        void init();
    }, [router]);

    return null;
}