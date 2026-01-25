"use client";

import { Button } from "@/app/_components/ui/button";
import {
    Tooltip,
    TooltipContent,
    TooltipTrigger,
} from "@/app/_components/ui/tooltip";
import { Pencil } from "lucide-react";
import { useRouter } from "next/navigation";

interface EditInteractionButtonProps {
    interactionId: number;
}

export function EditInteractionButton({
    interactionId,
}: EditInteractionButtonProps) {
    const router = useRouter();

    const handleEdit = () => {
        router.push(`/count/interaction/${interactionId}/edit`);
    };

    return (
        <Tooltip>
            <TooltipTrigger asChild>
                <Button variant="ghost" onClick={handleEdit}>
                    <Pencil />
                </Button>
            </TooltipTrigger>
            <TooltipContent>
                <p>Modifier la dépense</p>
            </TooltipContent>
        </Tooltip>
    );
}
