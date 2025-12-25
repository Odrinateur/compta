"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { api } from "@/trpc/server";

export async function loginAction(username: string, password: string) {
    try {
        const cookiesStore = await cookies();

        const user = await api.user.getUser({ username, password });
        if (user) {
            cookiesStore.set("token", user.token);
        } else {
            const result = await api.user.createUser({ username, password });
            cookiesStore.set("token", result.token);
        }
        redirect("/");
    } catch (error) {
        console.error("Login error:", error);
        throw error;
    }
}

