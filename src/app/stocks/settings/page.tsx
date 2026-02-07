import { H3, Link } from "@/app/_components/ui/typography";
import { getUser } from "@/lib/get-user";
import { EtfSettingsForm } from "@/app/_components/stocks/settings/etf-settings-form";
import { Button } from "@/app/_components/ui/button";
import { ArrowLeftIcon } from "lucide-react";

export default async function StocksSettingsPage() {
    const user = await getUser();

    return (
        <div className="relative flex flex-col gap-6 w-full">
            <div className="left-0 absolute flex items-center gap-2">
                <Link href="/stocks">
                    <Button size="icon">
                        <ArrowLeftIcon />
                    </Button>
                </Link>
            </div>
            <H3 className="w-full text-center">Paramètres ETF</H3>
            <EtfSettingsForm user={user} />
        </div>
    );
}
