import AddUserButton from "@/app/_components/tricount/users/add-button";
import { Avatars } from "@/app/_components/tricount/users/avatars";
import EditNameButton from "@/app/_components/tricount/edit-name-button";
import TricountName from "@/app/_components/tricount/name";
import { Link } from "@/app/_components/ui/typography";
import { getUser } from "@/lib/get-user";
import { api } from "@/trpc/server";
import { redirect } from "next/navigation";
import { Button } from "@/app/_components/ui/button";
import { ArrowLeftIcon, PlusIcon, SettingsIcon } from "lucide-react";
import { TrictountInteractionGridCard } from "@/app/_components/tricount/interaction/card";
import TricountStats from "@/app/_components/tricount/stats";
import { FloatingAddButton } from "@/app/_components/tricount/floating-add-button";

export default async function TricountPage({
    params,
}: {
    params: Promise<{ id: string }>;
}) {
    const { id } = await params;
    const user = await getUser();

    if (Number.isNaN(Number(id)) || Number(id) <= 0) {
        redirect("/tricount");
    }

    const tricount = await api.tricount.getTricountById({
        token: user?.token,
        idTri: Number(id),
    });

    if (!tricount) {
        redirect("/tricount");
    }

    return (
        <>
            <div className="relative flex w-full justify-center gap-2">
                <div className="absolute left-0 flex items-center gap-2">
                    <Link href="/tricount">
                        <Button size="icon">
                            <ArrowLeftIcon />
                        </Button>
                    </Link>
                    <Link href={`/tricount/${id}/settings`}>
                        <Button size="icon">
                            <SettingsIcon />
                        </Button>
                    </Link>
                    {/* Bouton + visible uniquement sur desktop */}
                    <Link
                        href={`/tricount/${id}/interaction/new`}
                        className="hidden sm:block"
                    >
                        <Button size="icon">
                            <PlusIcon />
                        </Button>
                    </Link>
                </div>
                <div className="mt-10 flex items-center justify-center gap-2 sm:mt-0">
                    <TricountName
                        user={user}
                        idTri={Number(id)}
                        initialName={tricount.name}
                    />
                    <EditNameButton
                        user={user}
                        idTri={Number(id)}
                        currentName={tricount.name}
                    />
                </div>
                <div className="absolute right-0 flex items-center gap-2">
                    <AddUserButton user={user} idTri={Number(id)} />
                    <Avatars user={user} idTri={Number(id)} />
                </div>
            </div>

            <TricountStats user={user} idTri={Number(id)} />

            <TrictountInteractionGridCard user={user} idTri={Number(id)} />

            <FloatingAddButton href={`/tricount/${id}/interaction/new`} />
        </>
    );
}
