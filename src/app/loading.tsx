import { Card, CardContent, CardWrapper } from "@/app/_components/ui/card";
import { Skeleton } from "@/app/_components/ui/skeleton";

export default function Loading() {
    return (
        <CardWrapper plus>
            <Card className="col-span-2">
                <CardContent className="flex flex-col justify-center items-center gap-6 py-6 min-h-full">
                    <Skeleton className="w-32 h-10" />
                    <Skeleton className="w-32 h-10" />
                    <Skeleton className="w-64 h-10" />
                    <Skeleton className="w-24 h-10" />
                </CardContent>
            </Card>
        </CardWrapper>
    )
}