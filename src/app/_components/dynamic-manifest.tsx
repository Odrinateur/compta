"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";

export function DynamicManifest() {
    const pathname = usePathname();

    useEffect(() => {
        // Remove any existing manifest link
        const existingLink = document.querySelector('link[rel="manifest"]');
        if (existingLink) {
            existingLink.remove();
        }

        // Create new manifest link with current path
        const link = document.createElement("link");
        link.rel = "manifest";
        link.href = `/manifest?start=${encodeURIComponent(pathname)}`;
        document.head.appendChild(link);

        return () => {
            link.remove();
        };
    }, [pathname]);

    return null;
}
