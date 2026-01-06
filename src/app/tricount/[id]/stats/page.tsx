import { H3, H4, Link, P } from "@/app/_components/ui/typography";
import { getUser } from "@/lib/get-user";
import { api } from "@/trpc/server";
import { redirect } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/app/_components/ui/card";
import { Button } from "@/app/_components/ui/button";
import { ArrowLeftIcon } from "lucide-react";
import { formatAmount } from "@/lib/utils";

export default async function StatsPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;
    const user = await getUser();

    if (Number.isNaN(Number(id)) || Number(id) <= 0) {
        redirect("/tricount");
    }

    const stats = await api.tricount.getTricountStats({ token: user?.token, idTri: Number(id) });

    if (!stats) {
        redirect("/tricount");
    }

    return (
        <>
            <div className="relative flex justify-center gap-2 mb-6 w-full">
                <H3 className="text-center">
                    {stats.name}
                </H3>
                <div className="left-0 absolute">
                    <Link href={`/tricount/${id}`}>
                        <Button size="icon">
                            <ArrowLeftIcon />
                        </Button>
                    </Link>
                </div>
            </div>

            {/* TODO: temp UI */}
            <div className="flex flex-col gap-4">
                <Card>
                    <CardHeader>
                        <CardTitle>Totaux</CardTitle>
                    </CardHeader>
                    <CardContent className="flex flex-col gap-4">
                        <div>
                            <P className="text-muted-foreground text-sm">Total global</P>
                            <H4>{formatAmount(stats.totalAmount)}</H4>
                        </div>
                        <div>
                            <P className="text-muted-foreground text-sm">Total du mois en cours</P>
                            <H4>{formatAmount(stats.totalThisMonth)}</H4>
                        </div>
                    </CardContent>
                </Card>

                {stats.debts && stats.debts.length > 0 ? (
                    <Card>
                        <CardHeader>
                            <CardTitle>Dettes entre personnes</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="flex flex-col gap-3">
                                {stats.debts.map((debt: { debtor: string; creditor: string; amount: number }, index: number) => (
                                    <div key={index} className="bg-muted rounded-lg flex justify-between items-center p-3">
                                        <P className="font-medium">
                                            <span className="font-semibold">{debt.debtor}</span> doit{" "}
                                            <span className="font-semibold">{formatAmount(debt.amount)}</span> à{" "}
                                            <span className="font-semibold">{debt.creditor}</span>
                                        </P>
                                    </div>
                                ))}
                            </div>
                        </CardContent>
                    </Card>
                ) : (
                    <Card>
                        <CardHeader>
                            <CardTitle>Dettes entre personnes</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <P className="text-muted-foreground">Aucune dette enregistrée</P>
                        </CardContent>
                    </Card>
                )}
            </div>
        </>
    );
}