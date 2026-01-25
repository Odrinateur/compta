"use client";

import { createPortal } from "react-dom";
import { useEffect, useState } from "react";
import { PlusIcon } from "lucide-react";
import { Button } from "../ui/button";
import { Link } from "../ui/typography";

interface FloatingAddButtonProps {
    href: string;
}

export function FloatingAddButton({ href }: FloatingAddButtonProps) {
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
    }, []);

    if (!mounted) return null;

    return createPortal(
        <Link
            href={href}
            className="fixed right-4 bottom-4 z-50 sm:hidden"
        >
            <Button size="icon" className="size-12 rounded-full shadow-lg">
                <PlusIcon className="size-6" />
            </Button>
        </Link>,
        document.body
    );
}
