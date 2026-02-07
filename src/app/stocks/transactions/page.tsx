import { getUser } from "@/lib/get-user";
import { StocksTransactions } from "@/app/_components/stocks/transactions";

export default async function StocksTransactionsPage() {
    const user = await getUser();

    return <StocksTransactions user={user} />;
}
