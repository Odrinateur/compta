import { DefaultInteractionTableSkeleton } from "@/app/_components/count/interaction/default-card";
import { InteractionCreationInputSkeleton } from "@/app/_components/count/interaction/creation-input";
import { Skeleton } from "@/app/_components/ui/skeleton";

export default function Loading() {
    return (
        <>
            <Skeleton className="mx-auto w-48 h-8" />
            <InteractionCreationInputSkeleton />
            <DefaultInteractionTableSkeleton />
        </>
    );
}
