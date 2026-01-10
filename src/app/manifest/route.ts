import { type NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
    const searchParams = request.nextUrl.searchParams;
    const startUrl = searchParams.get("start") ?? "/";

    const manifest = {
        name: "Compta",
        short_name: "Compta",
        description: "Application de comptabilité",
        start_url: startUrl,
        scope: "/",
        display: "standalone",
        background_color: "#ffffff",
        theme_color: "#000000",
        orientation: "portrait-primary",
        icons: [
            {
                src: "/icons/icon-192x192.svg",
                sizes: "192x192",
                type: "image/svg+xml",
                purpose: "any",
            },
            {
                src: "/icons/icon-512x512.svg",
                sizes: "512x512",
                type: "image/svg+xml",
                purpose: "any",
            },
        ],
    };

    return NextResponse.json(manifest, {
        headers: {
            "Content-Type": "application/manifest+json",
        },
    });
}
