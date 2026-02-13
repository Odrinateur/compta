import "@/styles/globals.css";

import { type Metadata, type Viewport } from "next";
import { Geist } from "next/font/google";

import { TRPCReactProvider } from "@/trpc/react";
import { HydrateClient } from "@/trpc/server";
import { H2 } from "./_components/ui/typography";
import { DynamicManifest } from "./_components/dynamic-manifest";

export const viewport: Viewport = {
    themeColor: "#000000",
    width: "device-width",
    initialScale: 1,
    maximumScale: 1,
    userScalable: false,
    viewportFit: "cover",
};

export const metadata: Metadata = {
    title: "Compta",
    description: "Application de comptabilité",
    icons: [
        { rel: "icon", url: "/favicon.ico" },
        { rel: "apple-touch-icon", url: "/apple-touch-icon.svg" },
    ],
    appleWebApp: {
        capable: true,
        statusBarStyle: "default",
        title: "Compta",
    },
    formatDetection: {
        telephone: false,
    },
};

const geist = Geist({
    subsets: ["latin"],
    variable: "--font-geist-sans",
});

export default async function RootLayout({
    children,
}: Readonly<{ children: React.ReactNode }>) {
    return (
        <html lang="en" className={`${geist.variable} h-full`}>
            <body className="relative h-full">
                <DynamicManifest />
                <TRPCReactProvider>
                    <header className="border-b flex justify-center items-center">
                        <H2>compt</H2>
                    </header>
                    <HydrateClient>{children}</HydrateClient>
                </TRPCReactProvider>
            </body>
        </html>
    );
}
