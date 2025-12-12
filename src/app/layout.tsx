import "@/styles/globals.css";

import { type Metadata } from "next";
import { Geist } from "next/font/google";

import { TRPCReactProvider } from "@/trpc/react";
import { Card, CardWrapper, CardContent } from "@/app/_components/ui/card";
import { Container } from "@/app/_components/ui/container";
import { H4 } from "@/app/_components/ui/typography";
import { Spacing } from "@/app/_components/ui/spacing";
import { ResponsiveSpacing } from "@/app/_components/ui/responsive-spacing";
import { HydrateClient } from "@/trpc/server";

export const metadata: Metadata = {
    title: "compta",
    description: "compta",
    icons: [{ rel: "icon", url: "/favicon.ico" }],
};

const geist = Geist({
    subsets: ["latin"],
    variable: "--font-geist-sans",
});

export default async function RootLayout({
    children,
}: Readonly<{ children: React.ReactNode }>) {
    return (
        <html lang="en" className={`${geist.variable} h-full overflow-hidden`}>
            <body className="relative h-full overflow-x-hidden overflow-y-auto overscroll-contain">
                <TRPCReactProvider>
                    <Container className="flex flex-col min-h-screen">
                        <CardWrapper grayed plus wrapperClassName="shrink-0">
                            <Card className="mx-5">
                                <CardContent className="flex justify-center w-full">
                                    <H4 className="text-2xl text-center tracking-tighter">start</H4>
                                </CardContent>
                            </Card>
                        </CardWrapper>
                        <div className="relative flex flex-col flex-1">
                            <ResponsiveSpacing>
                                <Spacing wrapperClassName="flex-1" />
                            </ResponsiveSpacing>
                            <main className="flex flex-col">
                                <HydrateClient>
                                    {children}
                                </HydrateClient>
                            </main>
                            <ResponsiveSpacing>
                                <Spacing wrapperClassName="flex-1" />
                            </ResponsiveSpacing>
                            <Spacing grayed size="xs" />
                        </div>
                    </Container>
                </TRPCReactProvider>
            </body >
        </html >
    );
}
