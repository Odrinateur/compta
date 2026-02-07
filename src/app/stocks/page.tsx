import { getUser } from "@/lib/get-user";
import { StocksDashboard } from "@/app/_components/stocks/dashboard";

interface StocksPageProps {
    searchParams: Promise<{ etf?: string; range?: string }>;
}

export default async function StocksPage({ searchParams }: StocksPageProps) {
    const user = await getUser();
    const { etf, range } = await searchParams;

    return (
        <StocksDashboard
            user={user}
            initialEtfId={etf ? Number(etf) : undefined}
            initialRange={range}
        />
    );
}
