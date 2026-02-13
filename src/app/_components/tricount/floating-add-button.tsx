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
        <Link href={href} className="sm:hidden right-6 bottom-6 z-50 fixed">
            <Button size="icon" className="shadow-lg rounded-full size-18">
                <PlusIcon className="size-12" />
            </Button>
        </Link>,
        document.body
    );
}
