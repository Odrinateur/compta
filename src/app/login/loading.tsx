import { Skeleton } from "../_components/ui/skeleton";

export default function LoginLoading() {
    return (
        <main className="flex flex-col justify-center items-center gap-4 h-full">
            <Skeleton className="w-64 h-10" />
            <Skeleton className="w-64 h-10" />
        </main>
    );
}