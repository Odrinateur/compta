import { getUser } from "@/lib/get-user";
import CreateTricountButton from "../_components/tricount/create-button";
import { TricountCardGrid } from "../_components/tricount/card";
import Link from "next/link";
import { Button } from "../_components/ui/button";
import { ArrowLeftIcon } from "lucide-react";
import { PushNotificationToggle } from "../_components/push-notification-toggle";

export default async function TricountsPage() {
    const user = await getUser();

    return (
        <>
            <div className="flex justify-center gap-2">
                <Link href="/">
                    <Button size="icon">
                        <ArrowLeftIcon />
                    </Button>
                </Link>
                <CreateTricountButton token={user?.token} />
                <PushNotificationToggle user={user} />
            </div>
            <section className="flex flex-col justify-start items-start gap-4 w-full">
                <TricountCardGrid user={user} />
            </section>
        </>
    );
}
