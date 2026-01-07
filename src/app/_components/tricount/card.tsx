"use client";

import { Card, CardTitle } from "../ui/card";
import Link from "next/link";
import { Skeleton } from "../ui/skeleton";
import { type Tricount, type MeUser } from "@/server/db/types";
import EditNameButton from "./edit-name-button";
import { api } from "@/trpc/react";

interface TricountCardProps {
    tricount: Tricount;
    user: MeUser | null;
}

function TricountCard({ tricount, user }: TricountCardProps) {
    return (
        <div key={tricount.id} className="relative w-full">
            <Link href={`/tricount/${tricount.id}`} className="block w-full">
                <Card className="flex justify-center items-center gap-0 py-0 min-h-[80px]">
                    <div className="flex justify-center items-center px-6 w-full h-full">
                        <CardTitle className="m-0 text-center leading-normal">
                            {tricount.name}
                        </CardTitle>
                    </div>
                </Card>
            </Link>
            {user && (
                <div
                    className="top-2 right-2 z-10 absolute"
                    onMouseDown={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                    }}
                    onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                    }}
                >
                    <EditNameButton
                        user={user}
                        idTri={tricount.id}
                        currentName={tricount.name}
                    />
                </div>
            )}
        </div>
    );
}

function TricountCardSkeleton() {
    return (
        <Card className="flex justify-center items-center gap-0 py-0 min-h-[80px]">
            <div className="flex justify-center items-center px-6 w-full h-full">
                <Skeleton className="w-full h-8" />
            </div>
        </Card>
    );
}

function TricountCardGrid({ user }: { user: MeUser }) {
    const { data: tricounts } = api.tricount.getTricountsByUser.useQuery({
        token: user.token,
    });

    if (!tricounts) {
        return <TricountCardGridSkeleton />;
    }

    return (
        <div className="gap-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 w-full">
            {tricounts?.map((tricount) => (
                <TricountCard
                    tricount={tricount}
                    user={user}
                    key={tricount.id}
                />
            ))}
        </div>
    );
}

function TricountCardGridSkeleton() {
    return (
        <div className="gap-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 w-full">
            {Array.from({ length: 3 }).map((_, index) => (
                <TricountCardSkeleton key={index} />
            ))}
        </div>
    );
}

export {
    TricountCard,
    TricountCardSkeleton,
    TricountCardGrid,
    TricountCardGridSkeleton,
};
