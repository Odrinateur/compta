import AddUserButton from "@/app/_components/tricount/users/add-button";
import Avatars from "@/app/_components/tricount/users/avatars";
import { H3 } from "@/app/_components/ui/typography";
import { getUser } from "@/lib/get-user";
import { api } from "@/trpc/server";
import { redirect } from "next/navigation";

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
                <H3 className="text-center">
                    {tricount.name}
                </H3>
                {tricount.users.length > 0 && (
                    <div className="right-0 absolute flex items-center gap-2">
                        <AddUserButton user={user} idTri={Number(id)} />
                        <Avatars users={tricount.users} user={user} idTri={Number(id)} />
                    </div>
                )}
            </div>
        </>
    );
}
