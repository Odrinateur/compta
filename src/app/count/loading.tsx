import { Skeleton } from "@/app/_components/ui/skeleton";
import { InteractionCreationInputSkeleton } from "@/app/_components/count/interaction/creation-input";
import { InteractionTableSkeleton } from "@/app/_components/count/interaction/card";

export default function Loading() {
    return (
        <>
            <section className="relative flex justify-center gap-4 w-full">
                <div className="left-0 absolute flex justify-center gap-2">
                    <Skeleton className="w-10 h-10" />
                    <Skeleton className="w-10 h-10" />
                </div>
                <Skeleton className="w-10 h-10" />
                <Skeleton className="w-32 h-8" />
                <Skeleton className="w-10 h-10" />
            </section>

            <div className="w-full text-center">
                <Skeleton className="mx-auto w-32 h-8" />
            </div>

            <InteractionCreationInputSkeleton />
            <InteractionTableSkeleton />
        </>
    );
}
