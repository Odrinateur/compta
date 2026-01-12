import { Skeleton } from "@/app/_components/ui/skeleton";
import { InteractionCreationInputSkeleton } from "../_components/count/month/interaction/creation-input";

export default function Loading() {
    return (
        <>
            <section className="flex justify-center gap-4 w-full">
                <Skeleton className="w-32 h-10" />
            </section>
            <InteractionCreationInputSkeleton />
        </>
    );
}
