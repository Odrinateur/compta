import { CardWrapper, Card, CardContent } from "@/app/_components/ui/card";
import { getUser } from "@/lib/get-user";
import { UserInitializer } from "@/app/_components/index/user-initializer";

export default async function Home() {
    const user = await getUser();

    if (!user) {
        return <UserInitializer />;
    }

    return (
        <CardWrapper plus>
            <Card className="col-span-2">
                <CardContent className="flex flex-col justify-center items-center gap-6 py-6 min-h-full">
                    <h1>Hello {user.id}</h1>
                </CardContent>
            </Card>
        </CardWrapper>
    );
}
