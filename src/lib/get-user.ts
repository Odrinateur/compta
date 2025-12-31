import { cookies } from "next/headers";
import { api } from "@/trpc/server";
import { redirect } from "next/navigation";

export const getUser = async () => {
    const cookiesStore = await cookies();
    const token = cookiesStore.get("token")?.value;

    if (!token) {
        redirect("/login");
    }

    try {
        const user = await api.user.getUserByToken({ token });
        if (!user) {
            redirect("/login");
        }
        return user;
    } catch {
        redirect("/login");
    }
};