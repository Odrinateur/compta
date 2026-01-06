import { getUser } from "@/lib/get-user";
import { api } from "@/trpc/server";
import CreateTricountButton from "../_components/tricount/create-button";
import { TricountCardGrid } from "../_components/tricount/card";
import Link from "next/link";
import { Button } from "../_components/ui/button";
import { ArrowLeftIcon } from "lucide-react";

export default async function TricountsPage() {
    const user = await getUser();
    const tricounts = await api.tricount.getTricountsByUser({ token: user?.token });

    return (
        <>
            <div className="flex justify-center gap-2">
                <Link href="/">
                    <Button size="icon">
                        <ArrowLeftIcon />
                    </Button>
                </Link>
                <CreateTricountButton token={user?.token} />
            </div>
            <section className="flex flex-col justify-start items-start gap-4 w-full">
                <TricountCardGrid tricounts={tricounts} />
            </section>
        </>
    );
}
