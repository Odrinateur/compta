import { getUser } from "@/lib/get-user";
import { api } from "@/trpc/server";
import CreateTricountButton from "../_components/tricount/create-button";
import { TricountCardGrid } from "../_components/tricount/card";

export default async function TricountsPage() {
    const user = await getUser();
    const tricounts = await api.tricount.getTricountsByUser({ token: user?.token });

    return (
        <>
            <CreateTricountButton token={user?.token} />
            <section className="flex flex-col justify-start items-start gap-4 w-full">
                <TricountCardGrid tricounts={tricounts} />
            </section>
        </>
    );
}
