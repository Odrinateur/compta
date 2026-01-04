import Link from "next/link";
import { Button } from "./_components/ui/button";

export default async function Home() {
    return (
        <main className="flex flex-col justify-start gap-4 px-8 py-4 h-full">
            <Link href="/count">
                <Button variant="link">
                    Count
                </Button>
            </Link>
        </main>
    );
}
