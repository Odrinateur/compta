import { H3 } from "@/app/_components/ui/typography";
import { getUser } from "@/lib/get-user";
import { DefaultInteractionTable } from "@/app/_components/count/interaction/default-card";
import { InteractionCreationInput } from "@/app/_components/count/interaction/creation-input";

export default async function CountSettingsPage() {
    const user = await getUser();

    return (
        <>
            <H3 className="w-full text-center">Paramètres de dépenses</H3>
            <InteractionCreationInput user={user} monthId={0} />
            <DefaultInteractionTable user={user} />
        </>
    );
}
