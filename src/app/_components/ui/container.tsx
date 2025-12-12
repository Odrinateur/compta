import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const containerVariants = cva("selection:bg-secondary/40 relative flex flex-col selection:text-primary", {
    variants: {
        width: {
            "3xl": "[&_[data-slot=card-wrapper]]:max-w-3xl [&_[data-slot=card-wrapper]]:mx-auto [&_[data-slot=spacing-wrapper]]:max-w-3xl [&_[data-slot=spacing-wrapper]]:mx-auto",
            "4xl": "[&_[data-slot=card-wrapper]]:max-w-4xl [&_[data-slot=card-wrapper]]:mx-auto [&_[data-slot=spacing-wrapper]]:max-w-4xl [&_[data-slot=spacing-wrapper]]:mx-auto",
            "5xl": "[&_[data-slot=card-wrapper]]:max-w-5xl [&_[data-slot=card-wrapper]]:mx-auto [&_[data-slot=spacing-wrapper]]:max-w-5xl [&_[data-slot=spacing-wrapper]]:mx-auto",
            "6xl": "[&_[data-slot=card-wrapper]]:max-w-6xl [&_[data-slot=card-wrapper]]:mx-auto [&_[data-slot=spacing-wrapper]]:max-w-6xl [&_[data-slot=spacing-wrapper]]:mx-auto",
            "7xl": "[&_[data-slot=card-wrapper]]:max-w-7xl [&_[data-slot=card-wrapper]]:mx-auto [&_[data-slot=spacing-wrapper]]:max-w-7xl [&_[data-slot=spacing-wrapper]]:mx-auto",
            "full": "[&_[data-slot=card-wrapper]]:max-w-full [&_[data-slot=spacing-wrapper]]:max-w-full",
            "none": "",
        },
    },
    defaultVariants: {
        width: "5xl",
    },
});

function Container({
    className,
    width,
    ...props
}: React.ComponentProps<"div"> & VariantProps<typeof containerVariants>) {
    return (
        <div
            data-slot="container"
            className={cn(
                containerVariants({ width }),
                className
            )}
            {...props}
        >
            {props.children}
        </div>
    );
}

export { Container, containerVariants };
