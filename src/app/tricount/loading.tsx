import { TricountCardGridSkeleton } from "../_components/tricount/card";
import { Skeleton } from "../_components/ui/skeleton";

export default function TricountsPageLoading() {
    return (
        <>
            <section className="flex flex-col justify-start items-start gap-4">
                <Skeleton className="size-9" />
            </section>
            <TricountCardGridSkeleton />
        </>
    );
}
