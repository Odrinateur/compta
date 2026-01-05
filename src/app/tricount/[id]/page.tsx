import AddUserButton from "@/app/_components/tricount/users/add-button";
import Avatars from "@/app/_components/tricount/users/avatars";
import { H3, Link } from "@/app/_components/ui/typography";
import { getUser } from "@/lib/get-user";
import { api } from "@/trpc/server";
import { redirect } from "next/navigation";
import { Button } from "@/app/_components/ui/button";
import { PlusIcon } from "lucide-react";

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
            <div className="relative flex justify-center gap-4 w-full">
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
                <div className="right-0 absolute flex items-center gap-2">
                    <AddUserButton user={user} idTri={Number(id)} />
                    <Avatars user={user} idTri={Number(id)} />
                </div>
            </div>
        </>
    );
}
