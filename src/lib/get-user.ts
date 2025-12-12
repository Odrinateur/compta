import { cookies } from "next/headers";
import { api } from "@/trpc/server";

export const getUser = async () => {
    const cookiesStore = await cookies();
    const userId = cookiesStore.get("userId")?.value;

    if (!userId || isNaN(parseInt(userId))) {
        return null;
    }

    try {
        return await api.user.getUser({ userId: parseInt(userId) });
    } catch {
        return null;
    }
};