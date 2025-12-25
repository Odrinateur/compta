import "@/styles/globals.css";

import { type Metadata } from "next";
import { Geist } from "next/font/google";

import { TRPCReactProvider } from "@/trpc/react";
import { HydrateClient } from "@/trpc/server";
import { H2 } from "./_components/ui/typography";

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
                    <header className="border-b flex justify-center items-center">
                        <H2>compta</H2>
                    </header>
                    <HydrateClient>
                        {children}
                    </HydrateClient>
                </TRPCReactProvider>
            </body >
        </html >
    );
}
