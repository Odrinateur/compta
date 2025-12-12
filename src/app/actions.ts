"use server";

import { cookies } from "next/headers";
import { api } from "@/trpc/server";

export async function ensureUserSession() {
    const cookieStore = await cookies();

    const user = await api.user.createUser();

    cookieStore.set("userId", user.id.toString());

    return { success: true, created: true };
}