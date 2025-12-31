"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { api } from "@/trpc/server";
import { TRPCError } from "@trpc/server";

export async function loginAction(username: string, password: string) {
    try {
        const cookiesStore = await cookies();

        let user = null;
        let result = null;

        try {
            user = await api.user.getUser({ username, password });
        } catch (error) {
            if (error instanceof TRPCError && error.code === "UNAUTHORIZED") {
                throw new Error("Invalid credentials");
            }
            throw error;
        }

        if (user) {
            cookiesStore.set("token", user.token);
        } else {
            try {
                result = await api.user.createUser({ username, password });
            } catch (error) {
                if (error instanceof TRPCError && error.code === "CONFLICT") {
                    throw new Error("User already exists");
                }
                throw error;
            }
            cookiesStore.set("token", result.token);
        }

        redirect("/");
    } catch (error) {
        console.error("Login error:", error);
        throw error;
    }
}

