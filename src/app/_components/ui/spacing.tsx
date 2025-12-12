import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";
import { PlusContainer } from "./plus-container";

const spacingVariants = cva("bg-card border-b flex flex-col w-full", {
    variants: {
        grayed: {
            true: "bg-[image:repeating-linear-gradient(315deg,var(--color-grayed)_0,var(--color-grayed)_1px,transparent_0,transparent_50%)] bg-[length:10px_10px] bg-fixed text-grayed",
        },
        plus: {
            true: "",
        },
    },
    defaultVariants: {
        grayed: false,
        plus: false,
    },
});

const wrapperVariants = cva("border-x relative w-full", {
    variants: {
        size: {
            full: "flex-1",
            xs: "h-12",
            sm: "h-16",
            md: "h-24",
            lg: "h-48",
            xl: "h-64"
        },
    },
    defaultVariants: {
        size: "full",
    },
});


function Spacing({
    className,
    wrapperClassName,
    grayed,
    plus,
    size,
    ...props
}: React.ComponentProps<"div"> & VariantProps<typeof spacingVariants> & VariantProps<typeof wrapperVariants> & { wrapperClassName?: string }) {
    return (
        <div data-slot="spacing" className={cn(spacingVariants({ grayed, plus }), wrapperClassName)}>
            <div
                data-slot="spacing-wrapper"
                className={cn(wrapperVariants({ size }),
                    className
                )}
                {...props}
            >
                {plus && <PlusContainer />}
                {props.children}
            </div>
        </div>
    );
}

export { Spacing, spacingVariants, wrapperVariants };