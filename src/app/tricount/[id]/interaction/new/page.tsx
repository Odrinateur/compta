import { TricountInteractionForm } from "@/app/_components/tricount/interaction/creation-inputs";
import { getUser } from "@/lib/get-user";
import { redirect } from "next/navigation";

export default async function NewInteractionPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;
    const user = await getUser();

    if (Number.isNaN(Number(id)) || Number(id) <= 0) {
        redirect("/tricount");
    }

    return (
        <>
            <TricountInteractionForm user={user} idTri={Number(id)} />
        </>
    );
}