import { getUser } from "@/lib/get-user";
import { api } from "@/trpc/server";

export default async function Home() {
    const user = await getUser();
    const currentMonth = await api.month.getCurrentMonth({ token: user?.token });

    return (
        <main className="flex flex-col justify-start items-start gap-4 h-full py-4 px-8">
            <h1>Current Month: {currentMonth.month.year} - {currentMonth.month.month}</h1>
        </main>
    );
}
