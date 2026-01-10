"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { api } from "@/trpc/server";
import { TRPCError } from "@trpc/server";
import { uint8ArrayToBase64 } from "@/lib/utils";

export async function loginAction(
    username: string,
    password: string,
    picture: File | null
) {
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

        const cookieOptions = {
            maxAge: 60 * 60 * 24 * 365, // 1 an
            path: "/",
            sameSite: "lax" as const,
            secure: process.env.NODE_ENV === "production",
        };

        if (user) {
            cookiesStore.set("token", user.token, cookieOptions);
        } else {
            let pictureBase64: string | undefined = undefined;
            if (picture) {
                const arrayBuffer = await picture.arrayBuffer();
                const buffer = Buffer.from(arrayBuffer);
                pictureBase64 = uint8ArrayToBase64(new Uint8Array(buffer));
            }

            try {
                result = await api.user.createUser({
                    username,
                    password,
                    picture: pictureBase64,
                    type: picture?.type.split("/")[1] ?? "png",
                });
            } catch (error) {
                if (error instanceof TRPCError && error.code === "CONFLICT") {
                    throw new Error("User already exists");
                }
                throw error;
            }
            cookiesStore.set("token", result.token, cookieOptions);
        }

        redirect("/");
    } catch (error) {
        console.error("Login error:", error);
        throw error;
    }
}
