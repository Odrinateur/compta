"use client";

import { useEffect, useState } from "react";

interface ResponsiveSpacingProps {
    children: React.ReactNode;
}

export function ResponsiveSpacing({
    children,
}: ResponsiveSpacingProps) {
    const [shouldShow, setShouldShow] = useState(true);

    useEffect(() => {
        const checkHeight = () => {
            const bodyHeight = document.body.scrollHeight;
            const viewportHeight = window.innerHeight;
            setShouldShow(bodyHeight <= viewportHeight);
        };

        const resizeObserver = new ResizeObserver(() => {
            checkHeight();
        });

        resizeObserver.observe(document.body);
        checkHeight();

        return () => {
            resizeObserver.disconnect();
        };
    }, []);

    if (!shouldShow) {
        return null;
    }

    return <>{children}</>;
}
