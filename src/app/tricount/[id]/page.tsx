import AddUserButton from "@/app/_components/tricount/users/add-button";
import Avatars from "@/app/_components/tricount/users/avatars";
import { H3, Link } from "@/app/_components/ui/typography";
import { getUser } from "@/lib/get-user";
import { api } from "@/trpc/server";
import { redirect } from "next/navigation";
import { Button } from "@/app/_components/ui/button";
import { ChartBarIcon, PlusIcon } from "lucide-react";
import { TrictountInteractionGridCard } from "@/app/_components/tricount/interaction/card";

export default async function TricountPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;
    const user = await getUser();

    if (Number.isNaN(Number(id)) || Number(id) <= 0) {
        redirect("/tricount");
    }

    const tricount = await api.tricount.getTricountById({ token: user?.token, idTri: Number(id) });

    if (!tricount) {
        redirect("/tricount");
    }

    return (
        <>
            <div className="relative flex justify-center gap-2 w-full">
                <div className="left-0 absolute">
                    <Link href={`/tricount/${id}/interaction/new`}>
                        <Button size="icon">
                            <PlusIcon />
                        </Button>
                    </Link>
                </div>
                <H3 className="text-center">
                    {tricount.name}
                </H3>
                <Link href={`/tricount/${id}/stats`}>
                    <Button size="icon" variant="ghost">
                        <ChartBarIcon />
                    </Button>
                </Link>
                <div className="right-0 absolute flex items-center gap-2">
                    <AddUserButton user={user} idTri={Number(id)} />
                    <Avatars user={user} idTri={Number(id)} />
                </div>
            </div>
            <TrictountInteractionGridCard user={user} idTri={Number(id)} />
        </>
    );
}
