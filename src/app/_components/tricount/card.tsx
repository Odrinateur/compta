import { Card, CardTitle } from "../ui/card";
import Link from "next/link";
import { Skeleton } from "../ui/skeleton";
import { type Tricount } from "@/server/db/types";


interface TricountCardProps {
    tricount: Tricount;
}

function TricountCard({ tricount }: TricountCardProps) {
    return (
        <Link href={`/tricount/${tricount.id}`} key={tricount.id} className="w-full">
            <Card className="flex justify-center items-center gap-0 py-0 min-h-[80px]">
                <div className="flex justify-center items-center px-6 w-full h-full">
                    <CardTitle className="m-0 text-center leading-normal">{tricount.name}</CardTitle>
                </div>
            </Card>
        </Link>
    )
}

function TricountCardSkeleton() {
    return (
        <Card className="flex justify-center items-center gap-0 py-0 min-h-[80px]">
            <div className="flex justify-center items-center px-6 w-full h-full">
                <Skeleton className="w-full h-8" />
            </div>
        </Card>
    )
}


function TricountCardGrid({ tricounts }: { tricounts: Tricount[] }) {
    return (
        <div className="gap-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 w-full">
            {tricounts.map((tricount) => (
                <TricountCard tricount={tricount} key={tricount.id} />
            ))}
        </div>
    )
}

function TricountCardGridSkeleton() {
    return (
        <div className="gap-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 w-full">
            {Array.from({ length: 3 }).map((_, index) => (
                <TricountCardSkeleton key={index} />
            ))}
        </div>
    )
}

export { TricountCard, TricountCardSkeleton, TricountCardGrid, TricountCardGridSkeleton }