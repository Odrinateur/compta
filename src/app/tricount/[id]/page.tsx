import AddUserButton from "@/app/_components/tricount/users/add-button";
import { Avatars } from "@/app/_components/tricount/users/avatars";
import EditNameButton from "@/app/_components/tricount/edit-name-button";
import TricountName from "@/app/_components/tricount/name";
import { H4, Link } from "@/app/_components/ui/typography";
import { getUser } from "@/lib/get-user";
import { api } from "@/trpc/server";
import { redirect } from "next/navigation";
import { Button } from "@/app/_components/ui/button";
import { ArrowLeftIcon, PlusIcon, ArrowRightIcon } from "lucide-react";
import { TrictountInteractionGridCard } from "@/app/_components/tricount/interaction/card";
import { formatAmount } from "@/lib/utils";
import OneAvatar from "@/app/_components/tricount/users/one-avatar";

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

    const stats = await api.tricount.getTricountStats({ token: user?.token, idTri: Number(id) });

    return (
        <>
            <div className="relative flex justify-center gap-2 w-full">
                <div className="left-0 absolute flex items-center gap-2">
                    <Link href="/tricount">
                        <Button size="icon">
                            <ArrowLeftIcon />
                        </Button>
                    </Link>
                    <Link href={`/tricount/${id}/interaction/new`}>
                        <Button size="icon">
                            <PlusIcon />
                        </Button>
                    </Link>
                </div>
                <div className="flex justify-center items-center gap-2">
                    <TricountName user={user} idTri={Number(id)} initialName={tricount.name} />
                    <EditNameButton user={user} idTri={Number(id)} currentName={tricount.name} />
                </div>
                <div className="right-0 absolute flex items-center gap-2">
                    <AddUserButton user={user} idTri={Number(id)} />
                    <Avatars user={user} idTri={Number(id)} />
                </div>
            </div>

            <div className="flex justify-center items-center gap-4 w-full">
                <H4>{new Date().toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' })}: {formatAmount(stats.totalThisMonth)}</H4>
                <H4>Total: {formatAmount(stats.totalAmount)}</H4>
            </div>

            <div className="flex flex-wrap justify-center items-center gap-4 w-full">
                {stats.debts.map((debt: { debtor: string; creditor: string; amount: number }, index: number) => (
                    <div key={index} className="border border-muted rounded-lg flex justify-center items-center gap-2 p-3">
                        <OneAvatar username={debt.debtor} currentUser={user} />
                        <p className="font-medium">
                            {formatAmount(debt.amount)}
                        </p>
                        <ArrowRightIcon className="size-4" />
                        <OneAvatar username={debt.creditor} currentUser={user} />
                    </div>
                ))}
            </div>

            <TrictountInteractionGridCard user={user} idTri={Number(id)} />
        </>
    );
}
