import { getUser } from "@/lib/get-user";

export default async function Home() {
    const user = await getUser();

    return (
        <main>
            <h1>Hello {user?.username}</h1>
        </main>
    );
}
