import { TricountInteractionEditWrapper } from "@/app/_components/tricount/interaction/edit-wrapper";
import { getUser } from "@/lib/get-user";
import { redirect } from "next/navigation";

export default async function EditInteractionPage({
    params,
}: {
    params: Promise<{ id: string; interactionId: string }>;
}) {
    const { id, interactionId } = await params;
    const user = await getUser();

    if (Number.isNaN(Number(id)) || Number(id) <= 0) {
        redirect("/tricount");
    }

    if (Number.isNaN(Number(interactionId)) || Number(interactionId) <= 0) {
        redirect(`/tricount/${id}`);
    }

    return (
        <TricountInteractionEditWrapper
            user={user}
            idTri={Number(id)}
            idInteraction={Number(interactionId)}
        />
    );
}
