import { Avatar, AvatarFallback, AvatarImage } from "@/app/_components/ui/avatar";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/app/_components/ui/tooltip";
import { H3 } from "@/app/_components/ui/typography";
import { getUser } from "@/lib/get-user";
import { api } from "@/trpc/server";
import { X } from "lucide-react";
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
            <div className="flex justify-center gap-4 w-full">
                <H3 className="text-center">
                    {tricount.name}
                </H3>
                {tricount.users.length > 0 && (
                    <div className="*:data-[slot=avatar]:grayscale *:data-[slot=avatar]:ring-2 *:data-[slot=avatar]:ring-background flex -space-x-2">
                        {tricount.users.map((inTricountUser: string) => (
                            <Tooltip key={inTricountUser}>
                                <TooltipTrigger asChild>
                                    <Avatar>
                                        <AvatarImage src="#" alt={inTricountUser} />
                                        <AvatarFallback>{inTricountUser.charAt(0)}</AvatarFallback>
                                    </Avatar>
                                </TooltipTrigger>
                                <TooltipContent>
                                    {inTricountUser}
                                    {inTricountUser !== user.username && (
                                        <X className="size-4" />
                                    )}
                                </TooltipContent>
                            </Tooltip>
                        ))}
                    </div>
                )}
            </div>
        </>
    );
}
