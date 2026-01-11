import { TricountCategoryCardGrid } from "@/app/_components/tricount/category/card";
import { Button } from "@/app/_components/ui/button";
import { H3 } from "@/app/_components/ui/typography";
import { getUser } from "@/lib/get-user";
import { ArrowLeftIcon } from "lucide-react";
import Link from "next/link";

export default async function TricountSettingsPage({
    params,
}: {
    params: Promise<{ id: string }>;
}) {
    const { id } = await params;
    const user = await getUser();

    return (
        <>
            <div className="relative flex justify-center gap-2 w-full">
                <div className="left-0 absolute flex items-center gap-2">
                    <Link href={`/tricount/${id}`}>
                        <Button size="icon">
                            <ArrowLeftIcon />
                        </Button>
                    </Link>
                </div>
                <H3 className="w-full text-center">Paramètres de catégories</H3>
            </div>
            <div className="flex flex-col gap-4 w-full">
                <TricountCategoryCardGrid user={user} idTri={Number(id)} />
            </div>
        </>
    );
}
